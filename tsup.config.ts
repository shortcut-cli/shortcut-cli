import { defineConfig } from 'tsup';
import { globSync } from 'glob';

export default defineConfig({
    entry: globSync('src/**/*.ts'),
    outDir: 'build',
    clean: true,
    splitting: false, // Disable code splitting to maintain file structure
});
