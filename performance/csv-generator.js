// info: Improved CSV generator with realistic hierarchical connections to existing Neo4j data
const fs = require('fs');
const path = require('path');
const { Faker, en } = require('@faker-js/faker');  // Import Faker class and locale
const neo4j = require('neo4j-driver');

const faker = new Faker({ locale: [en] }); // Create Faker instance with locale

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

// Function to find leaf employees (employees with managers but no subordinates)
async function findLeafEmployees(limit = 100) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    // Query to find employees who have managers but no subordinates
    const result = await session.run(`
      MATCH (e:Employee)
      WHERE EXISTS { MATCH (e)<-[:MANAGES]-(:Employee) }
      AND NOT EXISTS { MATCH (e)-[:MANAGES]->(:Employee) }
      RETURN e.email AS email, e.first_name AS first_name, e.last_name AS last_name
      LIMIT $limit
    `, { limit: neo4j.int(limit) });
    
    return result.records.map(record => ({
      email: record.get('email'),
      first_name: record.get('first_name'),
      last_name: record.get('last_name')
    }));
  } catch (error) {
    console.error('Error finding leaf employees:', error.message);
    return [];
  } finally {
    await session.close();
    await driver.close();
  }
}

/**
 * Generates employee data by connecting new hires to existing "leaf" employees in the database.
 * This creates a more realistic hierarchy by extending the bottom of the org chart.
 */
async function generateEmployeeDataWithConnections(numRecords, fileNumber) {
  const filename = `employees_${fileNumber}.csv`;
  const filepath = path.join('.', filename);

  console.log(`Finding leaf employees in the database to connect to...`);
  
  // Find 5 leaf employees in the database to use as connection points
  const leafEmployees = await findLeafEmployees(5);
  
  if (leafEmployees.length === 0) {
    console.log('No leaf employees found in database. Generating standalone file.');
    // Fall back to generating a file with its own internal hierarchy
    return generateStandaloneFile(numRecords, fileNumber);
  }
  
  console.log(`Found ${leafEmployees.length} leaf employees to use as roots`);
  
  const fieldnames = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'home_address',
    'department',
    'role',
    'salary',
    'manager_name',
    'manager_email',
  ];

  let csvContent = fieldnames.join(',') + '\n'; // CSV header
  
  // Start with the leaf employees as our initial pool of potential managers
  let potentialManagers = [...leafEmployees];
  
  // Generate employees in batches to improve performance and ensure even distribution
  for (let i = 0; i < numRecords; i += 10) {
    const batchSize = Math.min(10, numRecords - i);
    const newHires = [];
    
    for (let j = 0; j < batchSize; j++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const email = faker.internet.email({ firstName: firstName, lastName: lastName }).toLowerCase();
      
      // Assign a random manager from the current pool of potential managers
      const manager = faker.helpers.arrayElement(potentialManagers);
      const managerName = `${manager.first_name} ${manager.last_name}`;
      const managerEmail = manager.email;

      const row = [
        firstName,
        lastName,
        email,
        faker.phone.number('+1-555-####'),
        `"${faker.location.streetAddress()}"`,
        faker.commerce.department(),
        faker.person.jobTitle(),
        faker.number.int({ min: 50000, max: 200000 }),
        managerName,
        managerEmail,
      ];
      
      csvContent += row.join(',') + '\n';
      
      // The newly hired employee becomes a potential manager for future hires
      newHires.push({ first_name: firstName, last_name: lastName, email: email });
    }
    
    // Add all new hires from this batch to the pool of potential managers
    potentialManagers.push(...newHires);
  }

  fs.writeFileSync(filepath, csvContent, 'utf8');
  console.log(`File ${filename} generated successfully with ${numRecords} records.`);
}

/**
 * Generates a standalone CSV file with its own hierarchical structure.
 * Used when no connection points are available in the database.
 */
async function generateStandaloneFile(numRecords, fileNumber) {
  const filename = `employees_${fileNumber}.csv`;
  const filepath = path.join('.', filename);
  
  const fieldnames = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'home_address',
    'department',
    'role',
    'salary',
    'manager_name',
    'manager_email',
  ];

  let csvContent = fieldnames.join(',') + '\n'; // CSV header
  
  // Create a few top-level executives (CEOs, VPs) who have no managers
  const executives = [];
  const numExecutives = Math.min(5, Math.floor(numRecords * 0.1));
  
  for (let i = 0; i < numExecutives; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName: firstName, lastName: lastName }).toLowerCase();
    
    const row = [
      firstName,
      lastName,
      email,
      faker.phone.number('+1-555-####'),
      `"${faker.location.streetAddress()}"`,
      faker.commerce.department(),
      faker.person.jobTitle(),
      faker.number.int({ min: 100000, max: 200000 }),
      '', // No manager
      '', // No manager
    ];
    
    csvContent += row.join(',') + '\n';
    executives.push({ first_name: firstName, last_name: lastName, email: email });
  }
  
  // All employees will report up to either an executive or another employee
  let potentialManagers = [...executives];
  
  // Generate the remaining employees
  for (let i = numExecutives; i < numRecords; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName: firstName, lastName: lastName }).toLowerCase();
    
    // Assign a random manager from the current pool
    const manager = faker.helpers.arrayElement(potentialManagers);
    const managerName = `${manager.first_name} ${manager.last_name}`;
    const managerEmail = manager.email;
    
    const row = [
      firstName,
      lastName,
      email,
      faker.phone.number('+1-555-####'),
      `"${faker.location.streetAddress()}"`,
      faker.commerce.department(),
      faker.person.jobTitle(),
      faker.number.int({ min: 50000, max: 200000 }),
      managerName,
      managerEmail,
    ];
    
    csvContent += row.join(',') + '\n';
    
    // The newly hired employee becomes a potential manager for future hires
    potentialManagers.push({ first_name: firstName, last_name: lastName, email: email });
  }

  fs.writeFileSync(filepath, csvContent, 'utf8');
  console.log(`Standalone file ${filename} generated successfully with ${numRecords} records.`);
}

// Generate 10 files, each with 1000 records
async function generateAllFiles() {
  console.log('Starting CSV generation with database connections...');
  
  for (let i = 1; i <= 10; i++) {
    await generateEmployeeDataWithConnections(1000, i);
  }
  
  console.log('All CSV files generated successfully!');
}

// Run the generator
generateAllFiles().catch(console.error);