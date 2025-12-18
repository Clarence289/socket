module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000, // Increased timeout
  detectOpenHandles: true,
  forceExit: true,
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!node_modules/**',
    '!coverage/**',
    '!uploads/**',
    '!jest.config.js'
  ],
  // Skip MongoDB Memory Server tests for now
  testPathIgnorePatterns: [
    '/node_modules/',
    // Uncomment next line to skip MongoDB tests
    // '/models/.*\\.test\\.js$'
  ]
};