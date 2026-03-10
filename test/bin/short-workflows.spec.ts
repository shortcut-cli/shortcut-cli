import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-workflows', () => {
    it('should list workflows', async () => {
        const result = await runBin('short-workflows');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
              == States:
              #1 string
                   Type:   	string
                   Stories:	0",
          }
        `);
    });

    it('should filter workflow states by search', async () => {
        const result = await runBin('short-workflows', ['-s', 'nonexistent']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
              == States:",
          }
        `);
    });
});
