import { describe, it, expect, vi } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-create', () => {
    it('should require --title', async () => {
        const result = await runBin('short-create');
        expect(result.output.stdout).toContain('Must provide --title');
    });

    it('should require --project or --state when --title is given', async () => {
        const result = await runBin('short-create', ['--title', 'test story']);
        expect(result.output.stdout).toContain('Must provide --project or --state');
    });

    it.each([
        [
            'project',
            ['--title', 'test story', '--project', 'missing-project'],
            'Project missing-project not found',
        ],
        [
            'state',
            ['--title', 'test story', '--state', 'missing-state'],
            'State missing-state not found',
        ],
        [
            'team',
            ['--title', 'test story', '--state', '.', '--team', 'missing-team'],
            'Team missing-team not found',
        ],
        [
            'epic',
            ['--title', 'test story', '--state', '.', '--epic', 'missing-epic'],
            'Epic missing-epic not found',
        ],
        [
            'iteration',
            ['--title', 'test story', '--state', '.', '--iteration', 'missing-iteration'],
            'Iteration missing-iteration not found',
        ],
    ])('should report missing %s lookups clearly', async (_label, args, message) => {
        const result = await runBin('short-create', args);
        expect(result.output.stdout).toContain(message);
    });

    it('should report create API failures', async () => {
        const origArgv = process.argv;
        const origLog = console.log;
        const stdout: string[] = [];

        process.argv = ['node', 'src/bin/short-create.ts', '--title', 'test story', '--state', '.'];
        console.log = (...args: unknown[]) => {
            stdout.push(args.map(String).join(' '));
        };

        vi.resetModules();
        vi.doMock('../../src/lib/spinner', () => ({
            default: () => ({ start: () => {}, stop: () => {} }),
        }));
        vi.doMock('../../src/lib/client', () => ({
            default: {
                createStory: vi.fn().mockRejectedValue(new Error('boom')),
            },
        }));
        vi.doMock('../../src/lib/stories', () => ({
            default: {
                fetchEntities: vi.fn().mockResolvedValue({}),
                findState: vi.fn().mockReturnValue({ id: 1, name: 'Todo' }),
                findProject: vi.fn(),
                findGroup: vi.fn(),
                findEpic: vi.fn(),
                findIteration: vi.fn(),
                findOwnerIds: vi.fn().mockReturnValue([]),
                findLabelNames: vi.fn().mockReturnValue([]),
                hydrateStory: vi.fn((_, story) => story),
                printDetailedStory: vi.fn(),
            },
        }));

        try {
            await import('../../src/bin/short-create');
            await new Promise((resolve) => setTimeout(resolve, 50));
        } finally {
            vi.doUnmock('../../src/lib/spinner');
            vi.doUnmock('../../src/lib/client');
            vi.doUnmock('../../src/lib/stories');
            vi.resetModules();
            process.argv = origArgv;
            console.log = origLog;
        }

        expect(stdout.join('\n')).toContain('Error creating story');
    });

    it('should create a story with --title and --state', async () => {
        const result = await runBin('short-create', ['--title', 'test story', '--state', '.']);
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

    it('should create a story with --idonly (suppresses spinner, still shows full output)', async () => {
        // Note: --idonly in short-create suppresses the spinner but does NOT change
        // the output format — it still prints the full story details via printDetailedStory.
        // This differs from short-story where --idonly prints only the numeric ID.
        const result = await runBin('short-create', [
            '--title',
            'test story',
            '--state',
            '.',
            '--idonly',
        ]);
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

    it.each([
        [
            '--description, --estimate, --type bug',
            [
                '--title',
                'bug',
                '--state',
                '.',
                '--description',
                'desc',
                '--estimate',
                '3',
                '--type',
                'bug',
            ],
        ],
        ['--project', ['--title', 'project story', '--project', '.']],
        [
            '--owners and --label',
            ['--title', 'labeled', '--state', '.', '--owners', 'u', '--label', 'l'],
        ],
        // Use '.' (matches any entity via regex) to ensure lookup succeeds in Prism
        ['--team', ['--title', 'team story', '--state', '.', '--team', '.']],
        [
            '--epic and --iteration',
            ['--title', 'epic story', '--state', '.', '--epic', '.', '--iteration', '.'],
        ],
        ['--git-branch', ['--title', 'branch', '--state', '.', '--git-branch']],
        ['--git-branch-short', ['--title', 'short branch', '--state', '.', '--git-branch-short']],
    ])('should create with %s without crashing', async (_label, args) => {
        const result = await runBin('short-create', args);
        expect(result.output.exitCode).toBeUndefined();
        // Created story should include story details in output
        expect(result.output.stdout).toContain('State:');
        expect(result.output.stdout).toContain('URL:');
        // No error output expected
        expect(result.output.stderr).toBe('');
    });

    it('should open browser with --open', async () => {
        const result = await runBin('short-create', [
            '--title',
            'open story',
            '--state',
            '.',
            '--open',
        ]);
        expect(result.execCalls.length).toBeGreaterThan(0);
        expect(String(result.execCalls[0][0])).toContain('open ');
    });
});
