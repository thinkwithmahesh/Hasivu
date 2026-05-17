import nextConfig from 'eslint-config-next';

const ignores = [
  '.next/**',
  'coverage/**',
  'playwright-report/**',
  'test-results/**',
  'public/**',
  'node_modules/**',
  'openapi.yaml',
  'next-env.d.ts',
  'scripts/**',
  'tests/**',
  '**/*.config.js',
  '**/*.config.ts',
  '**/*.cjs',
  '**/*.mjs',
  'src/**/*.test.{ts,tsx,js,jsx}',
  'src/**/*.spec.{ts,tsx,js,jsx}',
];

export default [
  { ignores },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  ...nextConfig,
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@next/next/no-location-assign-relative-destination': 'off',
      '@next/next/no-img-element': 'off',
      'import/no-anonymous-default-export': 'off',
      'react/display-name': 'off',
      'react/no-children-prop': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'no-console': 'off',
    },
  },
];
