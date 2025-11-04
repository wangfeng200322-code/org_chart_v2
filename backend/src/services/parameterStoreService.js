import AWS from 'aws-sdk';

const ssm = new AWS.SSM({ region: process.env.AWS_REGION });
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
