module.exports = {
  parser: 'babel-eslint',
  extends: 'eslint:recommended',
  env: { node: true, es6: true },
  overrides: {
    files: ['**/__tests__/**/*.js'],
    env: { jest: true },
  },
};
