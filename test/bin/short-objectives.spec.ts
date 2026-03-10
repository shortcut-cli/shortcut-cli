import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-objectives', () => {
    it('should list objectives (empty without -a)', async () => {
        const result = await runBin('short-objectives');
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBe('');
    });

    it('should show archived objectives with -a', async () => {
        const result = await runBin('short-objectives', ['-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          State:		string
          Started:	yes
          Completed:	yes
          ",
          }
        `);
    });

    it('should show detailed objectives with -d -a', async () => {
        const result = await runBin('short-objectives', ['-d', '-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          State:		string
          Started:	yes
          Completed:	yes
          Updated:	2019-08-24T14:15:22Z
          Categories:	string
          URL:		2019-08-24T14:15:22Zrl
          Description:	string
          ",
          }
        `);
    });

    it.each([
        ['-t filter', ['-t', 'nonexistent']],
        ['-s (started)', ['-s']],
        ['-c (completed)', ['-c']],
        ['search text', ['test']],
        ['-S filter', ['-S', 'in progress']],
    ])('should return empty output with %s', async (_label, args) => {
        const result = await runBin('short-objectives', args);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBe('');
    });
});
