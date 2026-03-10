import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-workspace', () => {
    it('should report no workspace saved for unknown name', async () => {
        const result = await runBin('short-workspace', ['unknown-ws-name']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "No workspace saved with name unknown-ws-name
          Please run:
            short search [options] --save unknown-ws-name
          to create it.",
          }
        `);
    });

    it('should list workspaces with --list', async () => {
        const result = await runBin('short-workspace', ['--list']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Workspaces:",
          }
        `);
    });

    it('should unset a workspace with --unset', async () => {
        const result = await runBin('short-workspace', ['--unset', 'someWorkspace']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Successfully removed someWorkspace workspace",
          }
        `);
    });

    it('should load and run default workspace', async () => {
        const result = await runBin('short-workspace', ['default']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "No workspace saved with name default
          Please run:
            short search [options] --save default
          to create it.",
          }
        `);
    });
});
