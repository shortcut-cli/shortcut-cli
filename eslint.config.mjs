import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginImport from 'eslint-plugin-import';

export default tseslint.config(
    {
        ignores: ['**/node_modules', 'build'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        plugins: {
            import: { rules: pluginImport.rules },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    caughtErrors: 'none',
                    args: 'none',
                },
            ],
            'import/order': [
                'error',
                {
                    groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
                    'newlines-between': 'always',
                },
            ],
        },
    }
);
