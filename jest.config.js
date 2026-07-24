/** Jest-Konfiguration: Unit- und Feature-Tests, Coverage mit Schwellenwerten. */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/*Module.ts',
    '!src/config/**',
    '!src/migrations/**',
    '!src/**/Console/**',
    '!src/**/Jobs/**',
    '!src/**/Events/**',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: { branches: 55, functions: 70, lines: 80, statements: 80 },
    './src/Modules/User/Account/Domain/': { lines: 90, statements: 90 },
    './src/Modules/User/Account/Application/': { lines: 90, statements: 90 },
  },
};
