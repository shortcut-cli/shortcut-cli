import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-epics', () => {
    it('should list epics (empty without -a)', async () => {
        const result = await runBin('short-epics');
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBe('');
    });

    it('should show archived epics with -a', async () => {
        const result = await runBin('short-epics', ['-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          Milestone:	1
          Objectives:	string
          State:		string
          Archived:	true
          Deadline:	2019-08-24T14:15:22Z
          Points:		0
          Points Started: 0
          Points Done:	0
          Completion:	0%
          Started:	2019-08-24T14:15:22Z
          Completed:	2019-08-24T14:15:22Z
          ",
          }
        `);
    });

    it('should show detailed epics with -d -a', async () => {
        const result = await runBin('short-epics', ['-d', '-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          Milestone:	1
          Objectives:	string
          State:		string
          Archived:	true
          Deadline:	2019-08-24T14:15:22Z
          Points:		0
          Points Started: 0
          Points Done:	0
          Completion:	0%
          Started:	2019-08-24T14:15:22Z
          Completed:	2019-08-24T14:15:22Z
          Description:	string
          ",
          }
        `);
    });

    it('should use custom format with -f', async () => {
        const result = await runBin('short-epics', ['-f', '%id %t', '-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "1 string",
          }
        `);
    });

    it.each([
        ['-t filter', ['-t', 'nonexistent']],
        ['-s (started)', ['-s']],
        ['-c (completed)', ['-c']],
    ])('should return empty output with %s', async (_label, args) => {
        const result = await runBin('short-epics', args);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBe('');
    });
});
