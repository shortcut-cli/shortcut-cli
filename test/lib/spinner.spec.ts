import { describe, it, expect } from 'vitest';

import spinner from '../../src/lib/spinner';

describe('spinner', () => {
    it('returns an object with start and stop methods when called with no args', () => {
        const s = spinner();
        expect(s).toBeDefined();
        expect(typeof s.start).toBe('function');
        expect(typeof s.stop).toBe('function');
    });

    it('returns an object with start and stop methods when called with custom text', () => {
        const s = spinner('Fetching data... %s');
        expect(s).toBeDefined();
        expect(typeof s.start).toBe('function');
        expect(typeof s.stop).toBe('function');
    });
});
