import { vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockUse = vi.fn();

const axios = {
  create: vi.fn(() => ({
    interceptors: {
      request: {
        use: mockUse
      }
    },
    get: mockGet,
    post: mockPost
  })),
  get: mockGet,
  post: mockPost
};

export default axios;