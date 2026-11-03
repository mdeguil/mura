module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', 'coverage', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh'],
    rules: {
        // Keeps hot reload working: a file that exports a component should
        // export only components.
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
    overrides: [
        {
            // Test helpers are never hot-reloaded.
            files: ['src/test/**', '**/*.test.{ts,tsx}'],
            rules: { 'react-refresh/only-export-components': 'off' },
        },
    ],
}
