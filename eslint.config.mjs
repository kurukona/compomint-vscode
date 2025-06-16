import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        Buffer: 'readonly',
        Thenable: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      // TypeScript specific rules - relaxed for now
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      
      // General ESLint rules - relaxed for now
      'no-console': 'off',
      'no-debugger': 'warn',
      'no-duplicate-imports': 'off',
      'no-unused-expressions': 'off',
      'prefer-const': 'off',
      'no-var': 'error',
      'eqeqeq': 'off',
      'curly': 'off',
      'no-unused-vars': 'off',
      
      // Code style - relaxed for now
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off',
      'comma-dangle': 'off',
      'object-curly-spacing': 'off',
      'array-bracket-spacing': 'off',
      'space-before-function-paren': 'off',
      
      // Best practices - relaxed for now
      'no-throw-literal': 'off',
      'prefer-promise-reject-errors': 'off',
      'no-return-await': 'off',
      'require-await': 'off',
      'no-useless-escape': 'off'
    }
  },
  {
    files: ['src/**/*.test.ts'],
    languageOptions: {
      parser: tsparser,
      globals: {
        describe: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        console: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  },
  {
    ignores: [
      'out/**',
      'dist/**', 
      'node_modules/**',
      '*.js',
      'webpack.config.js'
    ]
  }
];