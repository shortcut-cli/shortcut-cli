import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-find', () => {
    it('should run search via short-find (deprecated alias)', async () => {
        const result = await runBin('short-find');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Fetching all stories for search since no search operators were passed ...",
          }
        `);
    });
});
