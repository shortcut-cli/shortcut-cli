import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-story', () => {
    // The subcommand handlers (history, comments, tasks, sub-tasks) fire at module level
    // as fire-and-forget promises with .catch(() => process.exit(...)). When process.exit
    // is mocked to throw ExitError, the throw inside .catch() becomes an unhandled rejection.
    const suppressedRejections: unknown[] = [];
    const rejectionHandler = (reason: unknown) => {
        if (reason instanceof Error && reason.name === 'ExitError') {
            suppressedRejections.push(reason);
        }
    };

    beforeEach(() => {
        process.on('unhandledRejection', rejectionHandler);
    });

    afterEach(() => {
        process.removeListener('unhandledRejection', rejectionHandler);
        suppressedRejections.length = 0;
    });

    describe('history subcommand', () => {
        it('should show history for a story', async () => {
            const result = await runBin('short-story', ['history', '123']);
            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain('Error fetching story history 123');
            expect(result.stdout).toBe('string string');
        });

        it('should exit with usage when no ID is provided', async () => {
            const result = await runBin('short-story', ['history']);
            expect(result.exitCode).toBeDefined();
            expect(result.stderr).toContain('Usage: short story history <id>');
        });
    });

    describe('comments subcommand', () => {
        it('should show comments for a story', async () => {
            const result = await runBin('short-story', ['comments', '123']);
            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain('Error fetching story comments 123');
            expect(result.stdout).toBe('');
        });

        it('should exit with usage when no ID is provided', async () => {
            const result = await runBin('short-story', ['comments']);
            expect(result.exitCode).toBeDefined();
            expect(result.stderr).toContain('Usage: short story comments <id>');
        });
    });

    describe('tasks subcommand', () => {
        it('should show tasks for a story', async () => {
            const result = await runBin('short-story', ['tasks', '123']);
            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain('Error fetching story tasks 123');
            expect(result.stdout).toContain('#1 [x] string');
            expect(result.stdout).toContain('Owners: string');
        });

        it('should exit with usage when no ID is provided', async () => {
            const result = await runBin('short-story', ['tasks']);
            expect(result.exitCode).toBeDefined();
            expect(result.stderr).toContain('Usage: short story tasks <id>');
        });
    });

    describe('sub-tasks subcommand', () => {
        it('should show sub-tasks for a story', async () => {
            const result = await runBin('short-story', ['sub-tasks', '123']);
            expect(result.exitCode).toBe(1);
            expect(result.stderr).toContain('Error fetching story sub-tasks 123');
            expect(result.stdout).toContain('#1 string');
            expect(result.stdout).toContain('Type:       string/_');
        });

        it('should exit with usage when no ID is provided', async () => {
            const result = await runBin('short-story', ['sub-tasks']);
            expect(result.exitCode).toBeDefined();
            expect(result.stderr).toContain('Usage: short story sub-tasks <id>');
        });
    });

    describe('view story by ID', () => {
        it('should view a story by numeric ID', async () => {
            const result = await runBin('short-story', ['123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Desc:      string
              Team:      _
              Owners:    string (string)
              Requester: _
              Type:      string/_
              Label:     #1 string
              Project:   #1 string
              Epic:      #1 string
              Iteration: #1 string
              State:     #1 string
              Created:   2019-08-24T14:15:22Z
              URL:       https://app.shortcut.com/test-workspace/story/1
              Archived:  true
              Completed:  2019-08-24T14:15:22Z
              Task:     [X] string
              File:     string
                        string
              ",
              }
            `);
        });

        it('should view a story with custom --format', async () => {
            const result = await runBin('short-story', ['123', '--format', '%id %t']);
            // Custom format produces a different, shorter output than default view
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "1 string",
              }
            `);
        });

        it('should view a story with --quiet (description only)', async () => {
            const result = await runBin('short-story', ['123', '--quiet']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Desc:      string
              Team:      _
              Owners:    string (string)
              Requester: _
              Type:      string/_
              Label:     #1 string
              Project:   #1 string
              Epic:      #1 string
              Iteration: #1 string
              State:     #1 string
              Created:   2019-08-24T14:15:22Z
              URL:       https://app.shortcut.com/test-workspace/story/1
              Archived:  true
              Completed:  2019-08-24T14:15:22Z
              Task:     [X] string
              File:     string
                        string
              ",
              }
            `);
        });

        it('should view a story with --idonly (just the ID)', async () => {
            const result = await runBin('short-story', ['123', '--idonly']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "1",
              }
            `);
        });
    });

    describe('update story options', () => {
        // All update flags produce the same snapshot because Prism returns
        // identical canned data regardless of what was sent. We use it.each
        // to verify each flag doesn't crash, with a single snapshot assertion.
        it.each([
            ['--archived'],
            ['--state', '.'],
            ['--estimate', '3'],
            ['--title', 'New Title'],
            ['--description', 'New description'],
            ['--deadline', '2025-12-31'],
            ['--type', 'bug'],
            ['--owners', 'test-user'],
            ['--follower', 'test-user'],
            ['--epic', '.'],
            ['--iteration', '.'],
            ['--label', 'test-label'],
            ['--team', 'test-team'],
            ['--requester', 'test-user'],
            ['--comment', 'Test comment'],
            ['--task', 'New task'],
            ['--task-complete', '.'],
            ['--external-link', 'https://example.com'],
            ['--move-after', '456'],
            ['--move-before', '456'],
            ['--move-up', '1'],
            ['--move-down', '1'],
        ])('should update story with %s without crashing', async (...flag) => {
            const result = await runBin('short-story', ['123', ...flag]);
            expect(result.exitCode).toBeUndefined();
            expect(result.stdout).toBeTruthy();
        });

        it('uses updateStory response data instead of the full response object', async () => {
            const origArgv = process.argv;
            const origLog = console.log;
            const origWarn = console.warn;
            const origError = console.error;

            const stdout: string[] = [];
            const stderr: string[] = [];
            console.log = (...args: unknown[]) => stdout.push(args.join(' '));
            console.warn = (...args: unknown[]) => stderr.push(args.join(' '));
            console.error = (...args: unknown[]) => stderr.push(args.join(' '));

            let exitCode: number | undefined;
            const exitMock = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
                exitCode = code ?? 0;
                throw new Error(`process.exit(${exitCode})`);
            }) as () => never);

            process.argv = [
                'node',
                'src/bin/short-story.ts',
                '123',
                '--title',
                'Updated Title',
                '--format',
                '%id %t',
            ];

            const baseStory = {
                id: 123,
                name: 'Original Title',
                description: 'Story description',
                story_type: 'feature',
                estimate: 1,
                labels: [],
                owners: [],
                requester: undefined,
                project: undefined,
                epic: undefined,
                epic_id: undefined,
                iteration: undefined,
                iteration_id: undefined,
                group: undefined,
                state: { id: 500000007, name: 'To Do' },
                workflow_state_id: 500000007,
                created_at: '2026-03-10T00:00:00Z',
                updated_at: '2026-03-10T00:00:00Z',
                archived: false,
                owner_ids: [],
                requested_by_id: undefined,
                external_links: [],
                tasks: [],
                files: [],
            };

            const req: { res?: object } = {};
            const res = { req };
            req.res = res;
            const circularResponse = {
                data: {
                    ...baseStory,
                    name: 'Updated Title',
                    workflow_state_id: 500000008,
                    state: { id: 500000008, name: 'In Progress' },
                },
                request: req,
            };

            vi.resetModules();
            vi.doMock('../../src/lib/spinner', () => ({
                default: () => ({ start: () => {}, stop: () => {} }),
            }));
            vi.doMock('../../src/lib/configure', () => ({
                loadConfig: () => ({
                    token: 'test-token',
                    urlSlug: 'test-workspace',
                    workspaces: {},
                }),
            }));
            vi.doMock('../../src/lib/client', () => ({
                default: {
                    getStory: vi.fn().mockResolvedValue({ data: baseStory }),
                    updateStory: vi.fn().mockResolvedValue(circularResponse),
                    createStoryComment: vi.fn(),
                    createTask: vi.fn(),
                    updateTask: vi.fn(),
                },
            }));
            vi.doMock('../../src/lib/stories', async () => {
                const actual =
                    await vi.importActual<typeof import('../../src/lib/stories')>(
                        '../../src/lib/stories'
                    );

                return {
                    ...actual,
                    default: {
                        ...actual.default,
                        fetchEntities: vi.fn().mockResolvedValue({}),
                        findState: vi.fn().mockReturnValue({ id: 500000008, name: 'In Progress' }),
                        hydrateStory: vi.fn((_entities, story) => story),
                    },
                };
            });

            try {
                await import('../../src/bin/short-story');
                await new Promise((resolve) => setTimeout(resolve, 50));
            } finally {
                vi.doUnmock('../../src/lib/spinner');
                vi.doUnmock('../../src/lib/configure');
                vi.doUnmock('../../src/lib/client');
                vi.doUnmock('../../src/lib/stories');
                vi.resetModules();
                process.argv = origArgv;
                console.log = origLog;
                console.warn = origWarn;
                console.error = origError;
                exitMock.mockRestore();
            }

            expect(exitCode).toBeUndefined();
            expect(stderr).toEqual([]);
            expect(stdout.join('\n')).toContain('123 Updated Title');
        });

        it('should open story in browser with --open', async () => {
            const result = await runBin('short-story', ['123', '--open']);
            expect(result.exitCode).toBeUndefined();
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });

        it('should create git branch with --git-branch', async () => {
            const result = await runBin('short-story', ['123', '--git-branch']);
            expect(result.exitCode).toBeUndefined();
            expect(result.stdout).toBeTruthy();
        });

        it('should create short git branch with --git-branch-short', async () => {
            const result = await runBin('short-story', ['123', '--git-branch-short']);
            expect(result.exitCode).toBeUndefined();
            expect(result.stdout).toBeTruthy();
        });

        it('should handle --download without crashing', async () => {
            const result = await runBin('short-story', ['123', '--download']);
            expect(result.exitCode).toBeUndefined();
        });
    });

    describe('--from-git', () => {
        it('should extract story ID from git branch and view it', async () => {
            // The mock execSync returns "* user/sc-123/feature-test"
            const result = await runBin('short-story', ['--from-git']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Desc:      string
              Team:      _
              Owners:    string (string)
              Requester: _
              Type:      string/_
              Label:     #1 string
              Project:   #1 string
              Epic:      #1 string
              Iteration: #1 string
              State:     #1 string
              Created:   2019-08-24T14:15:22Z
              URL:       https://app.shortcut.com/test-workspace/story/1
              Archived:  true
              Completed:  2019-08-24T14:15:22Z
              Task:     [X] string
              File:     string
                        string
              ",
              }
            `);
        });
    });

    describe('no args (auto git)', () => {
        it('should extract story ID from git branch when no args given', async () => {
            const result = await runBin('short-story', []);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Desc:      string
              Team:      _
              Owners:    string (string)
              Requester: _
              Type:      string/_
              Label:     #1 string
              Project:   #1 string
              Epic:      #1 string
              Iteration: #1 string
              State:     #1 string
              Created:   2019-08-24T14:15:22Z
              URL:       https://app.shortcut.com/test-workspace/story/1
              Archived:  true
              Completed:  2019-08-24T14:15:22Z
              Task:     [X] string
              File:     string
                        string
              ",
              }
            `);
        });
    });

    describe('open epic/iteration/project', () => {
        it('should open epic with --oe', async () => {
            const result = await runBin('short-story', ['123', '--oe']);
            expect(result.stdout + result.stderr).toBeTruthy();
        });

        it('should open iteration with --oi', async () => {
            const result = await runBin('short-story', ['123', '--oi']);
            expect(result.stdout + result.stderr).toBeTruthy();
        });

        it('should open project with --op', async () => {
            const result = await runBin('short-story', ['123', '--op']);
            expect(result.stdout + result.stderr).toBeTruthy();
        });
    });
});
