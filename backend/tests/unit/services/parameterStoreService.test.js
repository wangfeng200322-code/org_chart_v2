import { describe, beforeEach, it, expect, vi } from 'vitest';
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';

// Prepare mocks before importing the module under test
const mockSend = vi.fn();
const mockClient = { send: mockSend };

vi.mock('@aws-sdk/client-ssm', () => ({
  SSMClient: vi.fn(() => mockClient),
  GetParameterCommand: vi.fn(),
  PutParameterCommand: vi.fn()
}));

// Import after mocks are set up
import * as parameterStoreService from '../../../src/services/parameterStoreService.js';

describe('parameterStoreService (ESM mocks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // ensure the service uses our mock client
    parameterStoreService.setSSMClient(mockClient);
  });

  describe('getApiKeyFromParameterStore', () => {
    it('retrieves and parses API key data', async () => {
      const mockApiKey = { keyId: 'test', apiKey: 'secret', role: 'admin' };
      mockSend.mockResolvedValueOnce({ Parameter: { Value: JSON.stringify(mockApiKey) } });

      const res = await parameterStoreService.getApiKeyFromParameterStore('test');
      expect(res).toEqual(mockApiKey);
    });

    it('returns null for non-existent keys', async () => {
      mockSend.mockRejectedValueOnce({ name: 'ParameterNotFound' });
      const res = await parameterStoreService.getApiKeyFromParameterStore('nope');
      expect(res).toBeNull();
    });

    it('throws on invalid key parameter', async () => {
      await expect(parameterStoreService.getApiKeyFromParameterStore(null)).rejects.toThrow('Invalid API key identifier');
    });

    it('throws on AWS errors', async () => {
      const awsError = new Error('AWS Error');
      awsError.name = 'SomeAWSError';
      mockSend.mockRejectedValueOnce(awsError);
      await expect(parameterStoreService.getApiKeyFromParameterStore('test')).rejects.toThrow('Failed to retrieve API key: AWS Error');
    });
  });

  describe('storeApiKeyInParameterStore', () => {
    it('stores API key data', async () => {
      mockSend.mockResolvedValueOnce({});
      await parameterStoreService.storeApiKeyInParameterStore('test', 'secret', 'admin');
      expect(mockSend).toHaveBeenCalled();
    });

    it('throws on missing parameters', async () => {
      await expect(parameterStoreService.storeApiKeyInParameterStore('id', null, 'admin')).rejects.toThrow('Missing required parameters');
    });

    it('throws on invalid parameter types', async () => {
      await expect(parameterStoreService.storeApiKeyInParameterStore('id', 123, 'admin')).rejects.toThrow('Invalid parameter types');
    });

    it('throws on AWS errors', async () => {
      const awsError = new Error('AWS Error');
      awsError.name = 'SomeAWSError';
      mockSend.mockRejectedValueOnce(awsError);
      await expect(parameterStoreService.storeApiKeyInParameterStore('test', 'secret', 'admin')).rejects.toThrow('Failed to store API key: AWS Error');
    });
  });

  describe('getParameterString', () => {
    it('retrieves string parameter', async () => {
      mockSend.mockResolvedValueOnce({ Parameter: { Value: 'value' } });
      const res = await parameterStoreService.getParameterString('param');
      expect(res).toBe('value');
    });

    it('returns null for missing parameter', async () => {
      mockSend.mockRejectedValueOnce({ name: 'ParameterNotFound' });
      const res = await parameterStoreService.getParameterString('missing');
      expect(res).toBeNull();
    });

    it('throws on invalid name', async () => {
      await expect(parameterStoreService.getParameterString(null)).rejects.toThrow('Invalid parameter name');
    });
  });

  describe('getParameterJson', () => {
    it('retrieves and parses JSON parameter', async () => {
      const mockObj = { a: 1 };
      mockSend.mockResolvedValueOnce({ Parameter: { Value: JSON.stringify(mockObj) } });
      const res = await parameterStoreService.getParameterJson('json');
      expect(res).toEqual(mockObj);
    });

    it('throws on invalid JSON', async () => {
      mockSend.mockResolvedValueOnce({ Parameter: { Value: 'not-json' } });
      await expect(parameterStoreService.getParameterJson('bad')).rejects.toThrow('Parameter bad contains invalid JSON');
    });
  });
});