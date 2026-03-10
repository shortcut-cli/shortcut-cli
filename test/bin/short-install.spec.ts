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

    it('should save config with --force --token', async () => {
        const result = await runBin('short-install', [
            '--force',
            '--token',
            'test-token-for-prism-mock',
        ]);
        expect(result.output).toEqual({
            exitCode: undefined,
            stderr: '',
            stdout: 'Fetching user/member details from Shortcut...\nSaving config...\nSaved config',
        });
    });

    it('should require --token in non-interactive force mode', async () => {
        const result = await runBin('short-install', ['--force']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": 1,
            "stderr": "No API token provided. Pass --token when running non-interactively.",
            "stdout": "",
          }
        `);
    });
});
