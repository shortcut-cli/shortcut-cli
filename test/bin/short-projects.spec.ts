import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-projects', () => {
    it('should list projects including archived with -a', async () => {
        const result = await runBin('short-projects', ['-a']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          Points:         0
          Stories:        0
          Started:        2019-08-24T14:15:22Z
          Archived:       true
          ",
          }
        `);
    });

    it('should show detailed projects with -d', async () => {
        const result = await runBin('short-projects', ['-d', '-a']);
        // -d adds extra fields (Points, Stories, Description) beyond the default listing
        expect(result.stdout).toContain('Description:');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "#1 string
          Points:         0
          Stories:        0
          Started:        2019-08-24T14:15:22Z
          Archived:       true
          Description:     string
          ",
          }
        `);
    });

    it('should filter projects by title, returning empty for no match', async () => {
        const result = await runBin('short-projects', ['-a', '-t', 'nonexistent']);
        expect(result.stdout).toBe('');
        expect(result.exitCode).toBeUndefined();
    });
});
