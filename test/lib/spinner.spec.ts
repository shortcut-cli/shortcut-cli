import { describe, it, expect, vi, afterEach } from 'vitest';

import spinner from '../../src/lib/spinner';

describe('spinner', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

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

    it('uses default text when called with no args', () => {
        // The spinner uses 'Loading... %s ' as default text
        const s = spinner();
        // Verify it has a spinner string set (setSpinnerString(27) uses ⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)
        expect(s).toHaveProperty('text');
        // Default text should not be an empty string
        expect((s as { text?: string }).text).toBeTruthy();
    });

    it('uses custom text when provided', () => {
        const customText = 'Custom loading... %s';
        const s = spinner(customText);
        expect((s as { text?: string }).text).toBe(customText);
    });

    it('writes to stderr (not stdout)', () => {
        // Spinner is configured with stream: process.stderr to avoid polluting stdout
        const s = spinner();
        expect((s as unknown as { stream?: NodeJS.WriteStream }).stream).toBe(process.stderr);
    });

    it('can be started and stopped without throwing', () => {
        // Suppress actual stderr writes during start/stop
        const stderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
        const s = spinner('Test %s');
        expect(() => {
            s.start();
            s.stop(true);
        }).not.toThrow();
        stderrWrite.mockRestore();
    });
});
