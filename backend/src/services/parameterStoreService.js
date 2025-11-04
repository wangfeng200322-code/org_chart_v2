import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';
import dotenv from 'dotenv';

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

// Initialize SSM client with timeout and retry config
let ssm = new SSMClient({ 
  region,
  maxAttempts: 3,
  requestTimeout: 5000 // 5 second timeout
});

// Parameter path prefix for API keys with environment awareness
const paramPath = process.env.API_KEY_PARAM_PATH || 
  (process.env.NODE_ENV === 'production' ? '/org-chart/api-keys' : '/org-chart/dev/api-keys');

// For testing purposes only
export function setSSMClient(client) {
  ssm = client;
}
/**
 * Retrieves an API key from Parameter Store
 * @param {string} key - The API key identifier
 * @returns {Promise<{keyId: string, apiKey: string, role: string}|null>} The API key object or null if not found
 * @throws {Error} If the key parameter is invalid or AWS request fails
 */
export async function getApiKeyFromParameterStore(key) {
  if (!key || typeof key !== 'string') {
    throw new Error('Invalid API key identifier');
  }

  try {
    const cmd = new GetParameterCommand({ 
      Name: `${paramPath}/${key}`, 
      WithDecryption: true 
    });
    const res = await ssm.send(cmd);
      if (!res?.Parameter?.Value) return null;
    return JSON.parse(res.Parameter.Value);
  } catch (err) {
    if (err.name === 'ParameterNotFound') {
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
  if (!keyId || !apiKey || !role) {
    throw new Error('Missing required parameters: keyId, apiKey, and role are required');
  }

  if (typeof keyId !== 'string' || typeof apiKey !== 'string' || typeof role !== 'string') {
    throw new Error('Invalid parameter types: keyId, apiKey, and role must be strings');
  }

  const value = JSON.stringify({ keyId, apiKey, role });
  const cmd = new PutParameterCommand({ 
    Name: `${paramPath}/${keyId}`, 
    Value: value, 
    Type: 'SecureString', 
    Overwrite: true 
  });

  try {
    await ssm.send(cmd);
  } catch (err) {
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
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid parameter name');
  }

  try {
    const cmd = new GetParameterCommand({ 
      Name: name, 
      WithDecryption: true 
    });
    const res = await ssm.send(cmd);
    return res?.Parameter?.Value || null;
  } catch (err) {
    if (err.name === 'ParameterNotFound') {
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
  const value = await getParameterString(name);
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch (err) {
    throw new Error(`Parameter ${name} contains invalid JSON: ${err.message}`);
  }
}