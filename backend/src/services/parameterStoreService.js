import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Load .env for non-secret config (AWS_REGION) in development environments
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Region can come from environment or local dev .env (non-secret)
const region = process.env.AWS_REGION;
if (!region) {
  // Fail early with an informative message when region is not configured.
  throw new Error('AWS_REGION is not set. Please set AWS_REGION to the region where Parameter Store lives (e.g. eu-central-1).');
}

logger.debug('Initializing SSM client with region:', region);

// Initialize SSM client with timeout and retry config
let ssm = new SSMClient({ 
  region,
  maxAttempts: 3,
  requestTimeout: 5000 // 5 second timeout
});

// Parameter path prefix for API keys with environment awareness
const paramPath = process.env.API_KEY_PARAM_PATH || 
  (process.env.NODE_ENV === 'production' ? '/org-chart/api-keys' : '/org-chart/dev/api-keys');

logger.debug('Parameter path for API keys:', paramPath);

// For testing purposes only
export function setSSMClient(client) {
  logger.debug('SSM client updated');
  ssm = client;
}
/**
 * Retrieves an API key from Parameter Store
 * @param {string} key - The API key identifier
 * @returns {Promise<{keyId: string, apiKey: string, role: string}|null>} The API key object or null if not found
 * @throws {Error} If the key parameter is invalid or AWS request fails
 */
export async function getApiKeyFromParameterStore(key) {
  logger.debug('getApiKeyFromParameterStore called with key:', key ? '[PROVIDED]' : '[NOT PROVIDED]');
  
  if (!key || typeof key !== 'string') {
    logger.error('Invalid API key identifier');
    throw new Error('Invalid API key identifier');
  }

  try {
    const fullParamName = `${paramPath}/${key}`;
    logger.debug('Looking up parameter:', fullParamName);
    
    const cmd = new GetParameterCommand({ 
      Name: fullParamName, 
      WithDecryption: true 
    });
    
    const res = await ssm.send(cmd);
    logger.debug('Parameter store response:', res ? '[RECEIVED]' : '[EMPTY]');
    
    if (!res?.Parameter?.Value) {
      logger.debug('No value found in parameter response');
      return null;
    }
      
    const parsedValue = JSON.parse(res.Parameter.Value);
    logger.debug('Parsed parameter value:', parsedValue ? '[PARSED]' : '[EMPTY]');
    return parsedValue;
  } catch (err) {
    logger.error('Error retrieving API key from parameter store:', err);
    
    if (err.name === 'ParameterNotFound') {
      logger.debug('Parameter not found in store');
      return null;
    }
    throw new Error(`Failed to retrieve API key: ${err.message}`);
  }
}

/**
    if (!res?.Parameter?.Value) return null;
 * Stores an API key in Parameter Store
 * @param {string} keyId - The API key identifier
 * @param {string} apiKey - The API key value
 * @param {string} role - The role associated with this API key
 * @returns {Promise<void>}
 * @throws {Error} If parameters are invalid or AWS request fails
 */
export async function storeApiKeyInParameterStore(keyId, apiKey, role) {
  logger.debug('storeApiKeyInParameterStore called with keyId:', keyId);
  
  if (!keyId || !apiKey || !role) {
    logger.error('Missing required parameters for storing API key');
    throw new Error('Missing required parameters: keyId, apiKey, and role are required');
  }

  if (typeof keyId !== 'string' || typeof apiKey !== 'string' || typeof role !== 'string') {
    logger.error('Invalid parameter types for storing API key');
    throw new Error('Invalid parameter types: keyId, apiKey, and role must be strings');
  }

  const value = JSON.stringify({ keyId, apiKey, role });
  const fullParamName = `${paramPath}/${keyId}`;
  logger.debug('Storing parameter:', fullParamName);
  
  const cmd = new PutParameterCommand({ 
    Name: fullParamName, 
    Value: value, 
    Type: 'SecureString', 
    Overwrite: true 
  });

  try {
    await ssm.send(cmd);
    logger.debug('API key stored successfully');
  } catch (err) {
    logger.error('Error storing API key:', err);
    throw new Error(`Failed to store API key: ${err.message}`);
  }
}

/**
 * Retrieves a string parameter from Parameter Store
 * @param {string} name - The parameter name
 * @returns {Promise<string|null>} The parameter value or null if not found
 * @throws {Error} If the parameter name is invalid or AWS request fails
 */
export async function getParameterString(name) {
  logger.debug('getParameterString called with name:', name);
  
  if (!name || typeof name !== 'string') {
    logger.error('Invalid parameter name');
    throw new Error('Invalid parameter name');
  }

  try {
    const cmd = new GetParameterCommand({ 
      Name: name, 
      WithDecryption: true 
    });
    
    const res = await ssm.send(cmd);
    logger.debug('Parameter string response:', res?.Parameter?.Value ? '[RECEIVED]' : '[EMPTY]');
    return res?.Parameter?.Value || null;
  } catch (err) {
    logger.error('Error retrieving parameter string:', err);
    
    if (err.name === 'ParameterNotFound') {
      logger.debug('Parameter not found');
      return null;
    }
    throw new Error(`Failed to retrieve parameter: ${err.message}`);
  }
}

/**
 * Retrieves and parses a JSON parameter from Parameter Store
 * @param {string} name - The parameter name
 * @returns {Promise<object|null>} The parsed JSON object or null if not found/invalid
 * @throws {Error} If the parameter name is invalid or AWS request fails
 */
export async function getParameterJson(name) {
  logger.debug('getParameterJson called with name:', name);
  
  const value = await getParameterString(name);
  logger.debug('Raw parameter value for JSON parsing:', value ? '[RECEIVED]' : '[EMPTY]');
  
  if (!value) {
    logger.debug('No value to parse as JSON');
    return null;
  }
  
  try {
    const parsed = JSON.parse(value);
    logger.debug('Parsed JSON value:', parsed ? '[PARSED]' : '[EMPTY]');
    return parsed;
  } catch (err) {
    logger.error('Error parsing parameter as JSON:', err);
    throw new Error(`Parameter ${name} contains invalid JSON: ${err.message}`);
  }
}