import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-docs', () => {
    it('should list docs', async () => {
        const result = await runBin('short-docs');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "497f6eca-6276-4993-bfeb-53cbbbba6f08 string
          	URL: string",
          }
        `);
    });

    it('should show id-only output with -I', async () => {
        const result = await runBin('short-docs', ['-I']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
          }
        `);
    });

    it('should warn about filters without title', async () => {
        const result = await runBin('short-docs', ['-m']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Note: --archived, --mine, and --following require --title for searching.
          Listing all docs instead...
          497f6eca-6276-4993-bfeb-53cbbbba6f08 string
          	URL: string",
          }
        `);
    });

    // All search variations produce the same Prism doc listing
    it.each([
        ['title search', ['-t', 'test']],
        ['quiet output', ['-q']],
        ['mine flag', ['-t', 'test', '-m']],
        ['following flag', ['-t', 'test', '-f']],
        ['archived flag', ['-t', 'test', '-a']],
    ])('should list docs with %s', async (_label, args) => {
        const result = await runBin('short-docs', args);
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toBeTruthy();
    });
});
