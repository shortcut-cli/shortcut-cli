import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-teams', () => {
    it('should list teams including archived with -a', async () => {
        // Prism returns archived:true, so default listing filters them out.
        const result = await runBin('short-teams', ['-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#497f6eca-6276-4993-bfeb-53cbbbba6f08 string
          Mention:        string
          Stories:        0
          Started:        0
          Archived:       true
          ",
          }
        `);
    });

    it('should skip archived teams by default (Prism returns archived:true)', async () => {
        const result = await runBin('short-teams');
        expect(result.stdout).toBe('');
        expect(result.exitCode).toBeUndefined();
    });

    it('should filter teams by search, returning empty for no match', async () => {
        const result = await runBin('short-teams', ['-a', '-s', 'nonexistent']);
        expect(result.stdout).toBe('');
        expect(result.exitCode).toBeUndefined();
    });
});
