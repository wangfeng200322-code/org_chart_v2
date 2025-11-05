import { describe, test, expect, beforeEach, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiService, api } from '@/services/apiService.js'

// Create a mock adapter instance
const mock = new MockAdapter(api)

describe('apiService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mock.reset()
  })

  test('searchEmployees calls correct endpoint', async () => {
    const mockResponse = [{ email: 'test@example.com' }]
    mock.onGet('/employees/search').reply(200, mockResponse)

    const result = await apiService.searchEmployees('john')
    
    expect(result).toEqual(mockResponse)
    expect(mock.history.get[0].params).toEqual({ q: 'john' })
  })

  test('getEmployeeDetails calls correct endpoint', async () => {
    const mockResponse = { email: 'test@example.com' }
    mock.onGet('/employees/test%40example.com').reply(200, mockResponse)

    const result = await apiService.getEmployeeDetails('test@example.com')
    
    expect(result).toEqual(mockResponse)
  })

  test('getOrgChart calls correct endpoint', async () => {
    const mockResponse = { nodes: [], edges: [] }
    mock.onGet('/org-chart').reply(200, mockResponse)

    const result = await apiService.getOrgChart('test@example.com')
    
    expect(result).toEqual(mockResponse)
    expect(mock.history.get[0].params).toEqual({ email: 'test@example.com' })
  })

  test('uploadCSV sends file with correct content type', async () => {
    const mockFile = new File(['test,data'], 'test.csv', { type: 'text/csv' })
    const mockResponse = { success: true }
    mock.onPost('/upload/csv').reply(200, mockResponse)

    const result = await apiService.uploadCSV(mockFile)
    
    expect(result).toEqual(mockResponse)
    expect(mock.history.post[0].data).toBeInstanceOf(FormData)
  })

  test('handles API errors', async () => {
    mock.onGet('/employees/search').networkError()

    await expect(apiService.searchEmployees('test')).rejects.toThrow('Network Error')
  })
})