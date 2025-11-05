import { vi } from 'vitest';
import * as databaseMock from './mocks/database.js';

// Ensure we have AWS_REGION set for parameterStore tests
process.env.AWS_REGION = process.env.AWS_REGION || 'eu-central-1';

// Mock the database module
vi.mock('../src/config/database.js', () => databaseMock);

// Expose mock data for tests
export const mockEmployees = databaseMock.mockEmployees;

beforeAll(async () => {
  // Environment is fully mocked
  return Promise.resolve();
});