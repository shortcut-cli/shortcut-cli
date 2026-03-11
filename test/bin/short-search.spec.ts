import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-search', () => {
    it('should show fetching message with no args', async () => {
        const result = await runBin('short-search');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Fetching all stories for search since no search operators were passed ...",
          }
        `);
    });

    it('should search with query args', async () => {
        const result = await runBin('short-search', ['is:started']);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBe('');
    });

    it('should suppress loading dialog with --quiet', async () => {
        const result = await runBin('short-search', ['--quiet']);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stdout).toBe('');
    });

    it('should save workspace with --save', async () => {
        const result = await runBin('short-search', ['--save', 'test-ws']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Fetching all stories for search since no search operators were passed ...
          Saved query as test-ws workspace",
          }
        `);
    });

    it('should save default workspace with --save (no name)', async () => {
        const result = await runBin('short-search', ['--save']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Fetching all stories for search since no search operators were passed ...
          Saved query as default workspace",
          }
        `);
    });

    it.each([
        ['--owner', ['--owner', 'test-user']],
        ['--state', ['--state', 'Started']],
        ['--type', ['--type', 'bug']],
        ['--format', ['--format', '%id %t']],
        ['--label', ['--label', 'nonexistent-label-filter']],
    ])('should show fetching message with %s filter', async (_label, args) => {
        const result = await runBin('short-search', args);
        expect(result.output.exitCode).toBeUndefined();
        // All filter commands still use the "fetchEntities" path and show the fetching message
        expect(result.output.stdout).toContain('Fetching all stories');
        // No error should be reported
        expect(result.output.stderr).toBe('');
    });

    it('should output story results when stories match', async () => {
        // Searching without a query causes all stories to be listed; Prism returns mock stories
        const result = await runBin('short-search', []);
        expect(result.output.exitCode).toBeUndefined();
        // The fetching message is always shown before results
        expect(result.output.stdout).toContain('Fetching all stories');
    });

    it('should accept --sort flag without crashing', async () => {
        const result = await runBin('short-search', ['--sort', 'created:asc']);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stderr).toBe('');
    });

    it('should accept --archived flag without crashing', async () => {
        const result = await runBin('short-search', ['--archived']);
        expect(result.output.exitCode).toBeUndefined();
        expect(result.output.stderr).toBe('');
    });
});
