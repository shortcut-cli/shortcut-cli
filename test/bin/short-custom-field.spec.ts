import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-custom-field', () => {
    it('should exit 1 with no id given', async () => {
        const result = await runBin('short-custom-field');
        expect(result.exitCode).toBe(1);
    });

    it('should view a custom field by id', async () => {
        const result = await runBin('short-custom-field', ['12345678-1234-1234-1234-123456789012']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "497f6eca-6276-4993-bfeb-53cbbbba6f08 string
          Type:           enum
          Enabled:        true
          Story Types:    string
          Position:       0
          Fixed:          true
          Canonical:      string
          Description:    string
          Values:
            - string (497f6eca-6276-4993-bfeb-53cbbbba6f08) enabled=true position=0 color=string
          Created:        2019-08-24T14:15:22Z
          Updated:        2019-08-24T14:15:22Z",
          }
        `);
    });
});
