/**
 * Test harness for CLI commands.
 *
 * Since bin/ files execute on import (they call .parse(process.argv) at module
 * level), we run them as child processes using tsx against the source TS files.
 * The Prism mock server provides automatic spec-driven responses.
 *
 * For coverage, Vitest instruments the source files via NODE_V8_COVERAGE.
 */
import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const PRISM_BASE_URL = 'http://127.0.0.1:4010';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

/**
 * Run a CLI command as a child process via tsx.
 * The command is pointed at the Prism mock server via environment variables.
 *
 * @param command - The subcommand module filename, e.g. 'short-members'
 * @param args - CLI arguments
 */
export function runCommand(
    command: string,
    args: string[] = [],
    options: { timeout?: number; env?: Record<string, string> } = {}
): Promise<CommandResult> {
    const scriptPath = path.resolve(__dirname, `../../src/bin/${command}.ts`);

    return new Promise((resolve) => {
        execFile(
            'npx',
            ['tsx', scriptPath, ...args],
            {
                cwd: path.resolve(__dirname, '../..'),
                timeout: options.timeout ?? 10_000,
                env: {
                    ...process.env,
                    SHORTCUT_API_TOKEN: 'test-token-for-prism-mock',
                    SHORTCUT_URL_SLUG: 'test-workspace',
                    SHORTCUT_MENTION_NAME: 'test-user',
                    // Point the ShortcutClient at Prism by injecting the base URL
                    SHORTCUT_API_BASE_URL: PRISM_BASE_URL,
                    NODE_ENV: 'test',
                    ...options.env,
                },
            },
            (error, stdout, stderr) => {
                resolve({
                    exitCode:
                        error?.code ??
                        (typeof error === 'object' && error !== null && 'status' in error
                            ? (error as { status: number }).status
                            : 0),
                    stdout: stdout?.toString() ?? '',
                    stderr: stderr?.toString() ?? '',
                });
            }
        );
    });
}

export const MOCK_BASE_URL = PRISM_BASE_URL;
