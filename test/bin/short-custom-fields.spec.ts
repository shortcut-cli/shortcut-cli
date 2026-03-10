import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-custom-fields', () => {
    it('should list custom fields', async () => {
        const result = await runBin('short-custom-fields');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "497f6eca-6276-4993-bfeb-53cbbbba6f08 string
          Type:           enum
          Enabled:        true
          Story Types:    string
          Values:         1
          Description:    string
          ",
          }
        `);
    });

    it('should show disabled fields with -d (same Prism data)', async () => {
        const result = await runBin('short-custom-fields', ['-d']);
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toBeTruthy();
    });

    it('should filter custom fields by search with no match', async () => {
        const result = await runBin('short-custom-fields', ['-s', 'nonexistent']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "",
          }
        `);
    });

    it('should filter custom fields by search matching name', async () => {
        const result = await runBin('short-custom-fields', ['-s', 'string']);
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toContain('string');
    });
});
