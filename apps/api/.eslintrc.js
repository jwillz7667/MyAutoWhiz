module.exports = {
  extends: ['@myautowhiz/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // API-specific rules
    'no-console': 'off', // We use winston for logging
  },
};
