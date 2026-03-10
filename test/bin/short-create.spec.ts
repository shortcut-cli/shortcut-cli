import { describe, it, expect } from 'vitest';

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

    it('should create a story with --idonly', async () => {
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
        ['--team', ['--title', 'team story', '--state', '.', '--team', 't']],
        [
            '--epic and --iteration',
            ['--title', 'epic story', '--state', '.', '--epic', 'e', '--iteration', 'i'],
        ],
        ['--git-branch', ['--title', 'branch', '--state', '.', '--git-branch']],
        ['--git-branch-short', ['--title', 'short branch', '--state', '.', '--git-branch-short']],
    ])('should create with %s without crashing', async (_label, args) => {
        const result = await runBin('short-create', args);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBeTruthy();
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
