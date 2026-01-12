import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/**/*.ts'],
    outDir: 'build',
    format: 'cjs',
    clean: true,
    unbundle: true,
    outputOptions: {
        exports: 'named',
    },
});
