import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

// Prism mock returns groups with name "string" and mention_name "string"
const MOCK_TEAM_NAME = 'string';

describe('short-team', () => {
    it('should exit 1 with no args', async () => {
        const result = await runBin('short-team');
        expect(result.exitCode).toBe(1);
    });

    describe('view', () => {
        it('should view a team by name', async () => {
            const result = await runBin('short-team', ['view', MOCK_TEAM_NAME]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#497f6eca-6276-4993-bfeb-53cbbbba6f08 string
              Mention:        string
              Stories:        0
              Started:        0
              Backlog:        0
              Epics Started:  0
              Members:        1
              Workflows:      1
              Archived:       true
              Description:    string
              Color:          string
              URL:            string
              ",
              }
            `);
        });

        it('should treat bare name as implicit view', async () => {
            const result = await runBin('short-team', [MOCK_TEAM_NAME]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#497f6eca-6276-4993-bfeb-53cbbbba6f08 string
              Mention:        string
              Stories:        0
              Started:        0
              Backlog:        0
              Epics Started:  0
              Members:        1
              Workflows:      1
              Archived:       true
              Description:    string
              Color:          string
              URL:            string
              ",
              }
            `);
        });

        it('should exit 1 when team not found', async () => {
            const result = await runBin('short-team', ['view', 'nonexistent-team-xyz']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": 1,
                "stderr": "",
                "stdout": "Team nonexistent-team-xyz not found
              Error fetching team: process.exit(1)",
              }
            `);
        });
    });

    describe('stories', () => {
        it('should list stories for a team', async () => {
            const result = await runBin('short-team', ['stories', MOCK_TEAM_NAME]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
                  	Type:       string/_
                  	Team:       _
                  	Project:    string (#1)
                  	Epic:       string (#1)
                  	Iteration:  string (#1)
                  	Requester:  _
                  	Owners:     string (string)
                  	State:      string (#1)
                  	Labels:     string (#1)
                  	URL:        https://app.shortcut.com/test-workspace/story/1
                  	Created:    2019-08-24T14:15:22Z
                  	Updated:    _
                  	Archived:   true
                  ",
              }
            `);
        });

        it('should list stories with --detailed', async () => {
            const result = await runBin('short-team', ['stories', MOCK_TEAM_NAME, '--detailed']);
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
              ",
              }
            `);
        });

        it('should list stories with --format', async () => {
            const result = await runBin('short-team', [
                'stories',
                MOCK_TEAM_NAME,
                '--format',
                '%id %t',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "1 string",
              }
            `);
        });

        it('should exit 1 when team not found for stories', async () => {
            const result = await runBin('short-team', ['stories', 'nonexistent-team-xyz']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": 1,
                "stderr": "",
                "stdout": "Team nonexistent-team-xyz not found
              Error fetching team stories: process.exit(1)",
              }
            `);
        });
    });
});
