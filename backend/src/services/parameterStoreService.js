import AWS from 'aws-sdk';
// Load local .env for development/test runs so AWS_REGION (and other non-secret config) is available.
// We intentionally do not load secrets into .env; AWS credentials should come from shared credentials or environment.
import dotenv from 'dotenv';
dotenv.config();

const AWS_REGION = process.env.AWS_REGION || 'eu-central-1';
const ssm = new AWS.SSM({ region: AWS_REGION });
const paramPath = process.env.API_KEY_PARAM_PATH || '/org-chart/api-keys';

export async function getApiKeyFromParameterStore(key) {
  // In production, we would query Parameter Store. Here assume param name equals key.
  try {
    const res = await ssm.getParameter({ Name: `${paramPath}/${key}`, WithDecryption: true }).promise();
    return JSON.parse(res.Parameter.Value);
  } catch (err) {
    return null;
  }
}

export async function storeApiKeyInParameterStore(keyId, apiKey, role) {
  const value = JSON.stringify({ keyId, apiKey, role });
  return ssm.putParameter({ Name: `${paramPath}/${keyId}`, Value: value, Type: 'SecureString', Overwrite: true }).promise();
}

export async function getParameterString(name) {
  const res = await ssm.getParameter({ Name: name, WithDecryption: true }).promise();
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