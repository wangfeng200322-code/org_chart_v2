import { vi } from 'vitest';

const mockApi = {
  interceptors: {
    request: {
      use: vi.fn()
    }
  },
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} })
};

export default {
  create: vi.fn(() => mockApi)
};