import neo4j from 'neo4j-driver';
import { getParameterString, getParameterJson } from '../services/parameterStoreService.js';
import logger from '../utils/logger.js';
// Note: do not auto-load .env here. Credentials and AWS_REGION should be provided via environment or shared AWS config.

let driver = null;

export async function initDatabase() {
  logger.info('Initializing database connection');
  
  let uri = process.env.NEO4J_URI;
  let user = process.env.NEO4J_USER;
  let password = process.env.NEO4J_PASSWORD;

  logger.debug('Initial Neo4j connection parameters:', {
    uri,
    user: user ? '[SET]' : '[NOT SET]',
    password: password ? '[SET]' : '[NOT SET]',
    connectionParam: process.env.NEO4J_CONNECTION_PARAM
  });

  // Prefer SSM parameter when provided. If NEO4J_CONNECTION_PARAM is set, fetch and use it
  // This ensures production / AuraDB credentials stored in SSM are used instead of any local env file.
  if (process.env.NEO4J_CONNECTION_PARAM) {
    logger.info('Fetching Neo4j connection from SSM parameter:', process.env.NEO4J_CONNECTION_PARAM);
    const conn = await getParameterJson(process.env.NEO4J_CONNECTION_PARAM);
    logger.debug('SSM parameter content:', conn);
    if (conn) {
      // Support both uppercase and lowercase keys in the stored JSON
      uri = conn.NEO4J_URI || conn.neo4j_uri || uri;
      user = conn.NEO4J_USER || conn.neo4j_user || user;
      password = conn.NEO4J_PASSWORD || conn.neo4j_password || password;
      logger.debug('Updated connection parameters from SSM:', {
        uri,
        user: user ? '[SET]' : '[NOT SET]'
      });
    } else {
      const errorMsg = `NEO4J_CONNECTION_PARAM set to '${process.env.NEO4J_CONNECTION_PARAM}' but parameter not found or invalid`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  // Backward-compat: look up individual params if specified
  if (!uri && process.env.NEO4J_URI_PARAM) {
    logger.info('Fetching URI from SSM parameter:', process.env.NEO4J_URI_PARAM);
    uri = await getParameterString(process.env.NEO4J_URI_PARAM);
    logger.debug('URI from SSM:', uri);
  }
  if (!user && process.env.NEO4J_USER_PARAM) {
    logger.info('Fetching user from SSM parameter:', process.env.NEO4J_USER_PARAM);
    user = await getParameterString(process.env.NEO4J_USER_PARAM);
    logger.debug('User from SSM:', user ? '[SET]' : '[NOT SET]');
  }
  if (!password && process.env.NEO4J_PASSWORD_PARAM) {
    logger.info('Fetching password from SSM parameter:', process.env.NEO4J_PASSWORD_PARAM);
    password = await getParameterString(process.env.NEO4J_PASSWORD_PARAM);
    logger.debug('Password from SSM:', password ? '[SET]' : '[NOT SET]');
  }

  logger.info('Final connection parameters validation');
  logger.debug('Final connection parameters:', {
    uri,
    user: user ? '[SET]' : '[NOT SET]',
    password: password ? '[SET]' : '[NOT SET]'
  });

  if (!uri || !user || !password) {
    const errorMsg = 'Missing Neo4j connection information. Set NEO4J_CONNECTION_PARAM (SSM) or NEO4J_URI/NEO4J_USER/NEO4J_PASSWORD environment variables.';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Create driver with proper encryption settings for Neo4j 5
  // For local development with Neo4j 5 in Docker, we need to disable encryption
  const isLocalUri = uri.includes('bolt://') && (uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('neo4j'));
  logger.debug('Is local URI:', isLocalUri);
  
    const driverConfig = isLocalUri 
    ? { 
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000,
        encrypted: false
      }
    : { 
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000
      };
  

  logger.debug('Driver config:', driverConfig);

// Add connection retry logic
  const maxConnectionAttempts = 3;
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  for (let attempt = 1; attempt <= maxConnectionAttempts; attempt++) {
    try {
      logger.info('Attempting to create Neo4j driver with URI:', uri);
      driver = neo4j.driver(uri, neo4j.auth.basic(user, password), driverConfig);
      logger.info('Driver created successfully');
      
      logger.info('Testing connection...');
      const session = driver.session();
      
      // Test the connection
      await session.run('RETURN 1');
      logger.info('Connection test successful');
      await session.close();
      break; // Exit loop on success
    } catch (error) {
      logger.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }
  const session = driver.session();

  try {
    // Helper: retry transient DB initialization errors (locks, contention)
    const maxAttempts = 6;

    let attempt = 0;
    while (true) {
      attempt += 1;
      logger.info(`Database initialization attempt ${attempt}/${maxAttempts}`);
      try {
        // Create unique constraint for email
        logger.info('Creating email unique constraint...');
        await session.run('CREATE CONSTRAINT employee_email_unique IF NOT EXISTS FOR (e:Employee) REQUIRE e.email IS UNIQUE');
        logger.info('Email unique constraint created or already exists');
        
        // Create full-text index for flexible search
        logger.info('Creating full-text index...');
        await session.run('CREATE FULLTEXT INDEX employee_search IF NOT EXISTS FOR (e:Employee) ON EACH [e.first_name, e.last_name, e.email]');
        logger.info('Full-text index created or already exists');
        break;
      } catch (err) {
        logger.error(`Database initialization attempt ${attempt} failed:`, err);
        // If we've exhausted retries or the error is non-transient, rethrow
        const errText = String(err.message || err).toLowerCase();
        const isLockErr = errText.includes('lock') || errText.includes("can't acquire");
        if (!isLockErr || attempt >= maxAttempts) {
          throw err;
        }
        // Exponential backoff with jitter
        const backoff = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
        const jitter = Math.floor(Math.random() * 300);
        logger.warn(`Retrying in ${backoff + jitter}ms...`);
        await sleep(backoff + jitter);
      }
    }
  } finally {
    await session.close();
  }
  
  logger.info('Database initialized successfully');
}

export function getDriver() {
  if (!driver) {
    const errorMsg = 'Database not initialized';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return driver;
}

export async function closeDatabase() {
  if (driver) {
    logger.info('Closing database connection...');
    await driver.close();
    logger.info('Database connection closed');
  }
}