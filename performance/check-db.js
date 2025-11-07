const neo4j = require('neo4j-driver');

// Database configuration - using the same credentials as in docker-compose.yml
const DB_CONFIG = {
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'orgchart-neo4j-strong-password' // From docker-compose.yml
};

// Function to get database driver
function getDriver() {
  return neo4j.driver(
    DB_CONFIG.uri,
    neo4j.auth.basic(DB_CONFIG.user, DB_CONFIG.password),
    {
      encrypted: false // Disable encryption for local development
    }
  );
}

async function checkDatabase() {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    // Check total number of employees
    const countResult = await session.run('MATCH (e:Employee) RETURN count(e) AS count');
    const count = countResult.records[0].get('count').toNumber();
    console.log(`Total employees in database: ${count}`);
    
    if (count > 0) {
      // Get a few sample employees
      const sampleResult = await session.run('MATCH (e:Employee) RETURN e.email AS email, e.first_name AS first_name, e.last_name AS last_name LIMIT 5');
      console.log('Sample employees:');
      sampleResult.records.forEach(record => {
        console.log(`  ${record.get('first_name')} ${record.get('last_name')} - ${record.get('email')}`);
      });
    }
  } catch (error) {
    console.error('Error checking database:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkDatabase();