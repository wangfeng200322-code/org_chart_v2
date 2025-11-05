import neo4j from 'neo4j-driver';
import { getParameterString, getParameterJson } from '../services/parameterStoreService.js';
// Note: do not auto-load .env here. Credentials and AWS_REGION should be provided via environment or shared AWS config.

let driver = null;

export async function initDatabase() {
  let uri = process.env.NEO4J_URI;
  let user = process.env.NEO4J_USER;
  let password = process.env.NEO4J_PASSWORD;

  // Prefer SSM parameter when provided. If NEO4J_CONNECTION_PARAM is set, fetch and use it
  // This ensures production / AuraDB credentials stored in SSM are used instead of any local env file.
  if (process.env.NEO4J_CONNECTION_PARAM) {
    const conn = await getParameterJson(process.env.NEO4J_CONNECTION_PARAM);
    if (conn) {
      // Support both uppercase and lowercase keys in the stored JSON
      uri = conn.NEO4J_URI || conn.neo4j_uri || uri;
      user = conn.NEO4J_USER || conn.neo4j_user || user;
      password = conn.NEO4J_PASSWORD || conn.neo4j_password || password;
    } else {
      // If SSM param name was provided but not found, fail fast with informative error
      throw new Error(`NEO4J_CONNECTION_PARAM set to '${process.env.NEO4J_CONNECTION_PARAM}' but parameter not found or invalid`);
    }
  }

  // Backward-compat: look up individual params if specified
  if (!uri && process.env.NEO4J_URI_PARAM) {
    uri = await getParameterString(process.env.NEO4J_URI_PARAM);
  }
  if (!user && process.env.NEO4J_USER_PARAM) {
    user = await getParameterString(process.env.NEO4J_USER_PARAM);
  }
  if (!password && process.env.NEO4J_PASSWORD_PARAM) {
    password = await getParameterString(process.env.NEO4J_PASSWORD_PARAM);
  }

  if (!uri || !user || !password) {
    throw new Error('Missing Neo4j connection information. Set NEO4J_CONNECTION_PARAM (SSM) or NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD environment variables.');
  }

  // Create driver with proper encryption settings for Neo4j 5
  // For local development with Neo4j 5 in Docker, we need to disable encryption
  const isLocalUri = uri.includes('bolt://') && (uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('neo4j'));
  const driverConfig = isLocalUri 
    ? { 
        maxConnectionPoolSize: 50,
        encrypted: false // Disable encryption for local development
      }
    : { 
        maxConnectionPoolSize: 50
        // Use default encryption settings for remote/AuraDB connections
      };

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), driverConfig);
  const session = driver.session();

  try {
    // Helper: retry transient DB initialization errors (locks, contention)
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const maxAttempts = 6;

    let attempt = 0;
    while (true) {
      attempt += 1;
      try {
        // Create unique constraint for email
        await session.run('CREATE CONSTRAINT employee_email_unique IF NOT EXISTS FOR (e:Employee) REQUIRE e.email IS UNIQUE');
        // Create full-text index for flexible search
        await session.run('CREATE FULLTEXT INDEX employee_search IF NOT EXISTS FOR (e:Employee) ON EACH [e.first_name, e.last_name, e.email]');
        break;
      } catch (err) {
        // If we've exhausted retries or the error is non-transient, rethrow
        const errText = String(err.message || err).toLowerCase();
        const isLockErr = errText.includes('lock') || errText.includes("can't acquire");
        if (!isLockErr || attempt >= maxAttempts) {
          throw err;
        }
        // Exponential backoff with jitter
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.floor(Math.random() * 300);
        await sleep(backoff + jitter);
      }
    }
  } finally {
    await session.close();
  }
}

export function getDriver() {
  if (!driver) throw new Error('Database not initialized');
  return driver;
}

export async function closeDatabase() {
  if (driver) await driver.close();
}