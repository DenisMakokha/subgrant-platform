module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended',
    'prettier'
  ],
  plugins: ['security'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Error Prevention
    'no-console': 'warn',
    'no-unused-vars': ['error', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_' 
    }],
    'no-var': 'error',
    'prefer-const': 'error',
    
    // Security
    'security/detect-object-injection': 'off', // Too many false positives
    'security/detect-non-literal-fs-filename': 'off', // Common in migrations
    
    // Best Practices
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-param-reassign': ['error', { props: false }],
    
    // Code Style (handled by Prettier, but good to enforce)
    'no-trailing-spaces': 'warn',
    'quotes': ['warn', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js'
  ]
};
