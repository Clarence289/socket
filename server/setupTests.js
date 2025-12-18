// Global test setup
const mongoose = require('mongoose');

// Set test timeout
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  // Close any remaining mongoose connections
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});