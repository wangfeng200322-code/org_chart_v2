import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SSMClient } from '@aws-sdk/client-ssm';
import * as parameterStoreService from '../../../src/services/parameterStoreService.js';

// Mock the SSM client
jest.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: jest.fn(() => ({
    send: jest.fn()
  })),
  GetParameterCommand: jest.fn(),
  PutParameterCommand: jest.fn()
}));

describe('parameterStoreService', () => {
  let mockSend;

  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
    mockSend = SSMClient.mock.results[0].value.send;
  });

  describe('getApiKeyFromParameterStore', () => {
    it('should retrieve and parse API key data', async () => {
      const mockApiKey = { keyId: 'test', apiKey: 'secret', role: 'admin' };
      mockSend.mockResolvedValueOnce({
        Parameter: { Value: JSON.stringify(mockApiKey) }
      });

      const result = await parameterStoreService.getApiKeyFromParameterStore('test');
      expect(result).toEqual(mockApiKey);
    });

    it('should return null for non-existent keys', async () => {
      mockSend.mockRejectedValueOnce({ name: 'ParameterNotFound' });

      const result = await parameterStoreService.getApiKeyFromParameterStore('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw on invalid key parameter', async () => {
      await expect(parameterStoreService.getApiKeyFromParameterStore(null))
        .rejects.toThrow('Invalid API key identifier');
    });

    it('should throw on AWS errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('AWS Error'));

      await expect(parameterStoreService.getApiKeyFromParameterStore('test'))
        .rejects.toThrow('Failed to retrieve API key: AWS Error');
    });
  });

  describe('storeApiKeyInParameterStore', () => {
    it('should store API key data', async () => {
      mockSend.mockResolvedValueOnce({});

      await parameterStoreService.storeApiKeyInParameterStore('test', 'secret', 'admin');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should throw on missing parameters', async () => {
      await expect(parameterStoreService.storeApiKeyInParameterStore('test', null, 'admin'))
        .rejects.toThrow('Missing required parameters');
    });

    it('should throw on invalid parameter types', async () => {
      await expect(parameterStoreService.storeApiKeyInParameterStore('test', 123, 'admin'))
        .rejects.toThrow('Invalid parameter types');
    });

    it('should throw on AWS errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('AWS Error'));

      await expect(parameterStoreService.storeApiKeyInParameterStore('test', 'secret', 'admin'))
        .rejects.toThrow('Failed to store API key: AWS Error');
    });
  });

  describe('getParameterString', () => {
    it('should retrieve string parameter', async () => {
      mockSend.mockResolvedValueOnce({
        Parameter: { Value: 'test-value' }
      });

      const result = await parameterStoreService.getParameterString('test-param');
      expect(result).toBe('test-value');
    });

    it('should return null for non-existent parameters', async () => {
      mockSend.mockRejectedValueOnce({ name: 'ParameterNotFound' });

      const result = await parameterStoreService.getParameterString('nonexistent');
      expect(result).toBeNull();
    });

    it('should throw on invalid parameter name', async () => {
      await expect(parameterStoreService.getParameterString(null))
        .rejects.toThrow('Invalid parameter name');
    });
  });

  describe('getParameterJson', () => {
    it('should retrieve and parse JSON parameter', async () => {
      const mockJson = { key: 'value' };
      mockSend.mockResolvedValueOnce({
        Parameter: { Value: JSON.stringify(mockJson) }
      });

      const result = await parameterStoreService.getParameterJson('test-param');
      expect(result).toEqual(mockJson);
    });

    it('should throw on invalid JSON', async () => {
      mockSend.mockResolvedValueOnce({
        Parameter: { Value: 'invalid-json' }
      });

      await expect(parameterStoreService.getParameterJson('test-param'))
        .rejects.toThrow('Parameter test-param contains invalid JSON');
    });
  });
});