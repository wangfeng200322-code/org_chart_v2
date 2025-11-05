const { initDatabase, closeDatabase } = require('../src/config/database.js');

const skip = process.env.SKIP_DB_TESTS === '1';

beforeAll(async () => {
  if (skip) {
    // Tests that require DB are skipped by environment flag
    return;
  }

  // Initialize the database connection for integration tests
  // initDatabase will read NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD from env
  await initDatabase();
});

afterAll(async () => {
  if (skip) return;
  await closeDatabase();
});