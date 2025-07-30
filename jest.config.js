module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/eslint-rules'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
