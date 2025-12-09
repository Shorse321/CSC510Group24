export default {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'json', 'mjs'],
  testMatch: ['**/__tests__/**/bulkFeature.test.js', '**/__tests__/**/orderController.test.js'],
  // Remove or comment out this line:
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
    'routes/**/*.js'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/'
  ],
  coverageReporters: ['lcov', 'text', 'html'],
  testTimeout: 30000
};
