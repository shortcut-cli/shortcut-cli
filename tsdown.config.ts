import { defineConfig } from 'tsdown';
import { globSync } from 'glob';

export default defineConfig({
    entry: globSync('src/**/*.ts'),
    outDir: 'build',
    format: 'cjs',
    clean: true,
    unbundle: true,
    outputOptions: {
        exports: 'named',
    },
});
