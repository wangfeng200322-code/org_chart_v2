import neo4j from 'neo4j-driver';
import { getParameterString, getParameterJson } from '../services/parameterStoreService.js';

let driver = null;

export async function initDatabase() {
  let uri = process.env.NEO4J_URI;
  let user = process.env.NEO4J_USER;
  let password = process.env.NEO4J_PASSWORD;

  // If a single JSON parameter is provided (e.g., 'neo4j_connection_string'), read all fields from it
  if ((!uri || !user || !password) && process.env.NEO4J_CONNECTION_PARAM) {
    const conn = await getParameterJson(process.env.NEO4J_CONNECTION_PARAM);
    if (conn) {
      uri = uri || conn.NEO4J_URI;
      user = user || conn.NEO4J_USER;
      password = password || conn.NEO4J_PASSWORD;
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

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), { maxConnectionPoolSize: 50 });
  const session = driver.session();

  try {
    // Create unique constraint for email
    await session.run('CREATE CONSTRAINT employee_email_unique IF NOT EXISTS FOR (e:Employee) REQUIRE e.email IS UNIQUE');
    // Create full-text index for flexible search
    await session.run('CREATE FULLTEXT INDEX employee_search IF NOT EXISTS FOR (e:Employee) ON EACH [e.first_name, e.last_name, e.email]');
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
