import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['src/**/*.ts'],
    outDir: 'build',
    format: 'esm',
    fixedExtension: false,
    clean: true,
    unbundle: true,
    outputOptions: {
        exports: 'named',
    },
});
