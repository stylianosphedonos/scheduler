module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false,
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['./setup.js'],
  reporters: [
    'default',
    ['jest-html-reporter', {
      pageTitle: 'Resource Scheduler - Test Report',
      outputPath: './test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true
    }]
  ]
};

