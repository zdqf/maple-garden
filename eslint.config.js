import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const sourceFiles = ['**/*.{ts,tsx}'];

export default tseslint.config(
  {
    ignores: [
      '.kiro/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
    ],
  },
  {
    files: sourceFiles,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: sourceFiles,
  })),
  {
    ...reactHooks.configs.flat.recommended,
    files: sourceFiles,
  },
  {
    ...jsxA11y.flatConfigs.recommended,
    files: sourceFiles,
  },
  {
    files: sourceFiles,
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },
);
