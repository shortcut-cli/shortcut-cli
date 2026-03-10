import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-install', () => {
    it('should report already installed when token exists', async () => {
        const result = await runBin('short-install');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "A configuration/token is already saved. To override, re-run with --force",
          }
        `);
    });

    it('should refresh config with --refresh', async () => {
        const result = await runBin('short-install', ['--refresh']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Fetching user/member details from Shortcut...",
          }
        `);
    });

    it('should enter prompt flow with --force (non-interactive)', async () => {
        const result = await runBin('short-install', ['--force'], { maxMs: 3000 });
        expect(result.exitCode).toBeUndefined();
    });
});
