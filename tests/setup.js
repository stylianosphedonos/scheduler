// Jest setup file
// Increase timeout for API tests
jest.setTimeout(30000);

// Global fetch polyfill for Node.js < 18
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

// Console log test info
beforeAll(() => {
  console.log('\n========================================');
  console.log('Resource Scheduler API Test Suite');
  console.log('========================================\n');
});

afterAll(() => {
  console.log('\n========================================');
  console.log('Test Suite Complete');
  console.log('========================================\n');
});


