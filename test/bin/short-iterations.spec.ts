import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-iterations', () => {
    it('should list iterations', async () => {
        const result = await runBin('short-iterations');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          Status:		string
          Start:		2019-08-24T14:15:22Z
          End:		2019-08-24T14:15:22Z
          Teams:		string
          Stories:	0 (0 done)
          Points:		0 (0 done)
          ",
          }
        `);
    });

    it('should show detailed output with -d', async () => {
        const result = await runBin('short-iterations', ['-d']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          Status:		string
          Start:		2019-08-24T14:15:22Z
          End:		2019-08-24T14:15:22Z
          Teams:		string
          Stories:	0 (0 done)
          Points:		0 (0 done)
          Completion:	0%
          URL:		https://app.shortcut.com/test-workspace/iteration/1
          ",
          }
        `);
    });

    it('should filter by team with -T matching Prism group name', async () => {
        const result = await runBin('short-iterations', ['-T', 'string']);
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toContain('string');
    });

    it('should use custom format with -f', async () => {
        const result = await runBin('short-iterations', ['-f', '#%id %t']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string",
          }
        `);
    });

    it.each([
        ['-t filter', ['-t', 'nonexistent']],
        ['-S filter', ['-S', 'started']],
        ['-C (current)', ['-C']],
    ])('should return empty output with %s', async (_label, args) => {
        const result = await runBin('short-iterations', args);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBe('');
    });
});
