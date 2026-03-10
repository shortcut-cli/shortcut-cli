import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-labels', () => {
    it('should list labels including archived with -a', async () => {
        // Prism returns archived:true, so default listing filters them out.
        const result = await runBin('short-labels', ['-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          Color:          string
          Description:    string
          Archived:       true
          ",
          }
        `);
    });

    it('should skip archived labels by default (Prism returns archived:true)', async () => {
        const result = await runBin('short-labels');
        expect(result.stdout).toBe('');
        expect(result.exitCode).toBeUndefined();
    });

    it('should filter labels by search, returning empty for no match', async () => {
        const result = await runBin('short-labels', ['-a', '-s', 'nonexistent']);
        expect(result.stdout).toBe('');
        expect(result.exitCode).toBeUndefined();
    });
});
