import { defineConfig } from 'tsup';
import { globSync } from 'glob';

export default defineConfig({
    // Find all TypeScript files (excluding tests and type definitions)
    entry: globSync('src/**/*.ts'),
    outDir: 'build',
    format: ['cjs'],
    clean: true,
    splitting: false, // Disable code splitting to maintain file structure
});
