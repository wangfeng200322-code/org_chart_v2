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

const ssm = new SSMClient({ region });
const paramPath = process.env.API_KEY_PARAM_PATH || '/org-chart/api-keys';

export async function getApiKeyFromParameterStore(key) {
  try {
    const cmd = new GetParameterCommand({ Name: `${paramPath}/${key}`, WithDecryption: true });
    const res = await ssm.send(cmd);
    return JSON.parse(res.Parameter.Value);
  } catch (err) {
    return null;
  }
}

export async function storeApiKeyInParameterStore(keyId, apiKey, role) {
  const value = JSON.stringify({ keyId, apiKey, role });
  const cmd = new PutParameterCommand({ Name: `${paramPath}/${keyId}`, Value: value, Type: 'SecureString', Overwrite: true });
  return ssm.send(cmd);
}

export async function getParameterString(name) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: true });
  const res = await ssm.send(cmd);
  return res?.Parameter?.Value || null;
}

export async function getParameterJson(name) {
  const value = await getParameterString(name);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}