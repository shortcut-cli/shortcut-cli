import { describe, it, expect, vi } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-workspace', () => {
    it('should report no workspace saved for unknown name', async () => {
        const result = await runBin('short-workspace', ['unknown-ws-name']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "No workspace saved with name unknown-ws-name
          Please run:
            short search [options] --save unknown-ws-name
          to create it.",
          }
        `);
    });

    it('should list workspaces with --list', async () => {
        const result = await runBin('short-workspace', ['--list']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Workspaces:",
          }
        `);
    });

    it('should unset a workspace with --unset', async () => {
        const result = await runBin('short-workspace', ['--unset', 'someWorkspace']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Successfully removed someWorkspace workspace",
          }
        `);
    });

    it('should load and run default workspace', async () => {
        const result = await runBin('short-workspace', ['default']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "No workspace saved with name default
          Please run:
            short search [options] --save default
          to create it.",
          }
        `);
    });

    it('should preserve saved workspace filters when commander returns empty defaults', async () => {
        const origArgv = process.argv;
        const origLog = console.log;
        const stdout: string[] = [];

        process.argv = ['node', 'src/bin/short-workspace.ts', 'default'];
        console.log = (...args: unknown[]) => {
            stdout.push(args.map(String).join(' '));
        };

        const listStories = vi.fn().mockResolvedValue([]);
        const printFormattedStory = vi.fn(() => vi.fn());

        vi.resetModules();
        vi.doMock('../../src/lib/configure', () => ({
            default: {
                loadConfig: () => ({
                    token: 'test-token',
                    workspaces: {
                        default: {
                            text: 'saved query',
                            archived: true,
                        },
                    },
                }),
                removeWorkspace: vi.fn(),
            },
        }));
        vi.doMock('../../src/lib/stories', () => ({
            default: {
                listStories,
                printFormattedStory,
            },
        }));
        vi.doMock('../../src/bin/short-search', () => ({
            program: {
                parse: vi.fn().mockReturnValue({
                    opts: () => ({
                        text: '',
                        archived: false,
                        format: '',
                        quiet: false,
                    }),
                }),
            },
        }));

        try {
            await import('../../src/bin/short-workspace');
            await new Promise((resolve) => setTimeout(resolve, 50));
        } finally {
            vi.doUnmock('../../src/lib/configure');
            vi.doUnmock('../../src/lib/stories');
            vi.doUnmock('../../src/bin/short-search');
            vi.resetModules();
            process.argv = origArgv;
            console.log = origLog;
        }

        expect(listStories).toHaveBeenCalledWith(
            expect.objectContaining({ text: 'saved query', archived: true })
        );
        expect(stdout.join('\n')).toContain('Loading %s workspace ... default');
    });
});
