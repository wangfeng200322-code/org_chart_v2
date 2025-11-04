import neo4j from 'neo4j-driver';

let driver = null;

export async function initDatabase() {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

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
