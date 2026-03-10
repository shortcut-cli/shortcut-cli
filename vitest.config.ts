import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        testTimeout: 15_000,
        hookTimeout: 30_000,
        globalSetup: './test/global-setup.ts',
        setupFiles: ['./test/setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['src/**/*.ts'],
        },
    },
});
