/**
 * In-process test harness for CLI bin/ files.
 *
 * Since bin/ files execute on import (they call .parse(process.argv) and main()
 * at module level), we need to:
 *   1. Set process.argv before importing
 *   2. Mock process.exit to capture exit codes
 *   3. Capture console output
 *   4. Use vi.resetModules() + vi.doMock() + dynamic import() for fresh module state
 *
 * The spinner is mocked (it writes directly to stderr, polluting test output).
 * The real ShortcutClient talks to the Prism mock server.
 *
 * This runs everything inside the Vitest process so v8 coverage works.
 */
import { format } from 'util';

import { vi } from 'vitest';

export interface BinOutput {
    exitCode: number | undefined;
    stdout: string;
    stderr: string;
}

export interface BinResult extends BinOutput {
    /** All calls to child_process.exec, captured as argument arrays. */
    execCalls: unknown[][];
    /** Just exitCode/stdout/stderr — use for snapshot assertions. */
    output: BinOutput;
}

/**
 * Poll until output quiesces: no new lines for `quietMs`, or `maxMs` elapsed.
 * Resolves early if an exit code is set (process.exit was called).
 */
function waitForSettle(
    getState: () => { lines: number; exited: boolean },
    quietMs: number,
    maxMs: number
): Promise<void> {
    return new Promise((resolve) => {
        const start = Date.now();
        let lastLen = getState().lines;
        let stableTime = Date.now();

        const poll = () => {
            const { lines, exited } = getState();

            if (exited || Date.now() - start >= maxMs) {
                resolve();
                return;
            }

            if (lines !== lastLen) {
                lastLen = lines;
                stableTime = Date.now();
            } else if (Date.now() - stableTime >= quietMs) {
                resolve();
                return;
            }

            setTimeout(poll, 10);
        };

        // Give the async main() a moment to start before first poll
        setTimeout(poll, 20);
    });
}

/**
 * Run a CLI bin/ file in-process with the given arguments.
 *
 * @param binName - The module name without .ts, e.g. 'short-members'
 * @param args - CLI arguments (without node/script path)
 * @param opts - Options for the run
 * @returns Captured output and exit code
 */
export async function runBin(
    binName: string,
    args: string[] = [],
    opts: { quietMs?: number; maxMs?: number } = {}
): Promise<BinResult> {
    const quietMs = opts.quietMs ?? 100;
    const maxMs = opts.maxMs ?? 10_000;

    // Save originals
    const origArgv = process.argv;
    const origLog = console.log;
    const origWarn = console.warn;
    const origError = console.error;

    // Set process.argv to simulate CLI invocation
    process.argv = ['node', `src/bin/${binName}.ts`, ...args];

    // Capture output
    const stdoutLines: string[] = [];
    const stderrLines: string[] = [];

    console.log = (...a: unknown[]) => {
        stdoutLines.push(format(...a));
    };
    console.warn = (...a: unknown[]) => {
        stderrLines.push(format(...a));
    };
    console.error = (...a: unknown[]) => {
        stderrLines.push(format(...a));
    };

    // Mock process.exit
    let exitCode: number | undefined;
    const exitMock = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
        exitCode = code ?? 0;
        throw new ExitError(exitCode);
    }) as () => never);

    // Reset module registry and mock spinner + child_process
    vi.resetModules();
    vi.doMock('../../src/lib/spinner', () => ({
        default: () => ({ start: () => {}, stop: () => {} }),
    }));
    // Mock child_process to prevent opening browser tabs / running git commands.
    // execSync('git branch') must return a realistic branch name so --from-git works.
    const execCalls: unknown[][] = [];
    vi.doMock('child_process', () => ({
        exec: (...args: unknown[]) => {
            execCalls.push(args);
            // If a callback was passed, call it with no error
            const cb = args.find((a) => typeof a === 'function') as
                | ((err: null) => void)
                | undefined;
            if (cb) cb(null);
        },
        execSync: (cmd: string) => {
            // Record all execSync calls so tests can verify --open flags etc.
            execCalls.push([cmd]);
            if (typeof cmd === 'string' && cmd === 'git branch') {
                // Return a branch that matches /\*.*[0-9]+/ with /\/(ch|sc-)([0-9]+)/
                return Buffer.from('* user/sc-123/feature-test\n  main\n');
            }
            return Buffer.from('');
        },
    }));

    // Suppress ExitError unhandled rejections from fire-and-forget .catch() handlers
    // in Commander action callbacks that call process.exit (which throws ExitError).
    const rejectionHandler = (reason: unknown) => {
        if (reason instanceof ExitError) return; // suppress silently
    };
    process.on('unhandledRejection', rejectionHandler);

    try {
        // Dynamic import triggers module-level execution
        await import(`../../src/bin/${binName}.ts`);
    } catch (e) {
        if (!(e instanceof ExitError)) {
            stderrLines.push(String(e));
        }
    }

    // Wait for the fire-and-forget main() promise to settle.
    await waitForSettle(
        () => ({
            lines: stdoutLines.length + stderrLines.length,
            exited: exitCode !== undefined,
        }),
        quietMs,
        maxMs
    );

    // Clean up rejection handler
    process.removeListener('unhandledRejection', rejectionHandler);

    // Restore everything
    process.argv = origArgv;
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
    exitMock.mockRestore();

    const output: BinOutput = {
        exitCode,
        stdout: stdoutLines.join('\n'),
        stderr: stderrLines.join('\n'),
    };
    return {
        ...output,
        execCalls,
        output,
    };
}

class ExitError extends Error {
    constructor(public code: number) {
        super(`process.exit(${code})`);
        this.name = 'ExitError';
    }
}
