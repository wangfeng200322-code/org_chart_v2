import { vi } from 'vitest';

// Mock data for tests
const mockEmployees = [
  { name: 'John Smith', email: 'john@example.com', role: 'Engineer', managerId: '2' },
  { name: 'Sarah Johnson', email: 'sarah@example.com', id: '2', role: 'Manager' },
];

// Mock neo4j session
const mockSession = {
  run: vi.fn().mockImplementation(() => ({ records: [] })),
  close: vi.fn().mockResolvedValue(null)
};

// Mock neo4j driver
const mockDriver = {
  session: () => mockSession,
  close: vi.fn().mockResolvedValue(null)
};

// Helper to create neo4j-like record structure
function createNeo4jRecord(props) {
  return {
    get: (key) => ({
      properties: props
    })
  };
}

// Configure default mock responses
mockSession.run.mockImplementation(async (query) => {
  if (query.includes('fulltext.queryNodes')) {
    return {
      records: mockEmployees.map(emp => createNeo4jRecord(emp))
    };
  }
  if (query.includes('Employee {email:')) {
    return {
      records: [createNeo4jRecord(mockEmployees[0])]
    };
  }
  return { records: [] };
});

// Exports
export const getDriver = () => mockDriver;
export const initDatabase = async () => mockDriver;
export const closeDatabase = async () => Promise.resolve();

// For test assertions
export { mockEmployees };