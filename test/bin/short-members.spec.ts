import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-members', () => {
    it('should list members including disabled with -d', async () => {
        // Prism returns disabled:true, so default listing filters them out.
        // The -d flag is the only way to see the mock member.
        const result = await runBin('short-members', ['-d']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#497f6eca-6276-4993-bfeb-53cbbbba6f08
          Name:           string
          Mention Name:   string
          Role:           string
          Email:          string
          Disabled:       true
          ",
          }
        `);
    });

    it('should skip disabled members by default (Prism returns disabled:true)', async () => {
        const result = await runBin('short-members');
        // No members shown because mock member is disabled and -d not passed
        expect(result.stdout).toBe('');
        expect(result.exitCode).toBeUndefined();
    });

    it('should filter members by search, returning empty for no match', async () => {
        const result = await runBin('short-members', ['-d', '-s', 'nonexistent']);
        // -d to include disabled members, but search excludes them
        expect(result.stdout).toBe('');
        expect(result.exitCode).toBeUndefined();
    });
});
