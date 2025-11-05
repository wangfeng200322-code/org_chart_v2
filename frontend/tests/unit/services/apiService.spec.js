import { describe, test, expect, beforeEach, vi } from 'vitest'

// Define get/post functions that will be shared between tests
const mockGet = vi.fn().mockResolvedValue({ data: {} });
const mockPost = vi.fn().mockResolvedValue({ data: {} });

// Setup axios mock as a separate auto-executed function
vi.mock('axios', () => {
  const mockRequestUse = vi.fn();
  return {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: mockRequestUse
        }
      },
      get: mockGet,
      post: mockPost
    })),
    default: {
      create: vi.fn()
    }
  }
});

import { apiService } from '@/services/apiService.js'

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: {} });
    mockPost.mockResolvedValue({ data: {} });
  });

  test('searchEmployees calls correct endpoint', async () => {
    const mockResponse = { data: [{ email: 'test@example.com' }] };
    mockGet.mockResolvedValueOnce(mockResponse);

    await apiService.searchEmployees('john');
    
    expect(mockGet).toHaveBeenCalledWith('/employees/search', {
      params: { q: 'john' }
    });
  });

  test('getEmployeeDetails calls correct endpoint', async () => {
    const mockResponse = { data: { email: 'test@example.com' } };
    mockGet.mockResolvedValueOnce(mockResponse);

    await apiService.getEmployeeDetails('test@example.com');
    
    expect(mockGet).toHaveBeenCalledWith('/employees/test%40example.com');
  });

  test('getOrgChart calls correct endpoint', async () => {
    const mockResponse = { data: { nodes: [], edges: [] } };
    mockGet.mockResolvedValueOnce(mockResponse);

    await apiService.getOrgChart('test@example.com');
    
    expect(mockGet).toHaveBeenCalledWith('/org-chart', {
      params: { email: 'test@example.com' }
    });
  });

  test('uploadCSV sends file with correct content type', async () => {
    const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    const mockResponse = { data: { success: true } };
    mockPost.mockResolvedValueOnce(mockResponse);

    await apiService.uploadCSV(mockFile);
    
    expect(mockPost).toHaveBeenCalledWith('/upload/csv', expect.any(FormData));
  });

  test('includes API key in request headers when available', () => {
    // Get the axios mock and its call arguments
    const axiosMock = vi.mocked(require('axios'));
    const mockApi = axiosMock.create();
    const interceptor = mockApi.interceptors.request.use.mock.calls[0][0];

    // Mock storage
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
    getItemSpy.mockReturnValue('test-api-key');
    
    // Test the interceptor
    const config = { headers: {} };
    const result = interceptor(config);
    
    expect(result.headers['X-API-Key']).toBe('test-api-key');
    getItemSpy.mockRestore();
  });

  test('handles API errors', async () => {
    const error = new Error('Network Error');
    mockGet.mockRejectedValueOnce(error);

    await expect(apiService.searchEmployees('test')).rejects.toThrow('Network Error');
  });
});