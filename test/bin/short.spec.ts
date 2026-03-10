import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short', () => {
    it.each([['--help'], ['--version']])('should exit 0 with %s', async (...args) => {
        const result = await runBin('short', args);
        expect(result.exitCode).toBe(0);
    });
});
