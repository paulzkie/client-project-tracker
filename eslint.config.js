import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['node_modules', 'public', 'vendor', 'resources/js/actions', 'resources/js/routes', 'resources/js/wayfinder'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['resources/js/**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            globals: { ...globals.browser, ...globals.es2022 },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactPlugin.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            // TypeScript's own types already validate props at compile time;
            // this rule predates TS and wants runtime PropTypes declarations.
            'react/prop-types': 'off',
        },
        settings: {
            react: { version: 'detect' },
        },
    },
    {
        // shadcn/ui-style primitives intentionally export several small
        // components per file (Dialog/DialogContent/DialogHeader/...) — that's
        // the standard compound-component pattern for this kind of UI kit, not
        // a Fast Refresh problem worth restructuring around.
        files: ['resources/js/components/ui/**/*.tsx'],
        rules: {
            'react-refresh/only-export-components': 'off',
        },
    },
    {
        files: ['**/*.config.{js,ts}'],
        languageOptions: {
            globals: { ...globals.node },
        },
    },
    eslintConfigPrettier,
);
