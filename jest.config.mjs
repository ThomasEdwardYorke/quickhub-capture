export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/__mocks__/obsidian.ts',
  },
  testMatch: ['<rootDir>/test/**/*.test.ts'],
};
