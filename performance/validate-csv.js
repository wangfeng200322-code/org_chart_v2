// Script to validate CSV files and check if managers exist either in the same file or in the database
const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');
const { parse } = require('csv-parse/sync');

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

// Function to check if an employee exists in the database
async function employeeExistsInDB(email) {
  const driver = getDriver();
  const session = driver.session();
  
  try {
    const result = await session.run(
      'MATCH (e:Employee {email: $email}) RETURN e.email AS email LIMIT 1',
      { email: email }
    );
    
    return result.records.length > 0;
  } catch (error) {
    console.error('Error checking employee in database:', error.message);
    return false;
  } finally {
    await session.close();
    await driver.close();
  }
}

// Function to validate a CSV file
async function validateCSV(filePath) {
  console.log(`Validating CSV file: ${filePath}`);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  // Read and parse the CSV file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${records.length} records in the file`);
  
  // Create a set of all employees in the file for quick lookup
  const employeesInFile = new Set();
  records.forEach(record => {
    if (record.email) {
      employeesInFile.add(record.email.toLowerCase());
    }
  });
  
  console.log(`Found ${employeesInFile.size} unique employees in the file`);
  
  // Validate each record
  const invalidRecords = [];
  
  for (const record of records) {
    // Skip header row if it accidentally got included
    if (record.first_name === 'first_name' && record.last_name === 'last_name') {
      continue;
    }
    
    // Check required fields
    if (!record.first_name || !record.last_name || !record.email) {
      invalidRecords.push({
        record: record,
        reason: 'Missing required fields (first_name, last_name, or email)'
      });
      continue;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email)) {
      invalidRecords.push({
        record: record,
        reason: 'Invalid email format'
      });
      continue;
    }
    
    // If there's no manager, it's valid
    if (!record.manager_email || record.manager_email.trim() === '') {
      invalidRecords.push({
      record: record,
      reason: `Record without Manager email '${recordfirst_name} ${record.last_name}}' `});
      continue;
    }
    
    // Check if manager exists either in the file or in the database
    const managerEmail = record.manager_email.toLowerCase();
    
    // First check if manager exists in the same file
    if (employeesInFile.has(managerEmail)) {
      continue; // Manager exists in file, so it's valid
    }
    
    // If not in file, check if manager exists in the database
    const existsInDB = await employeeExistsInDB(managerEmail);
    if (existsInDB) {
      continue; // Manager exists in DB, so it's valid
    }
    
    // If we reach here, the manager doesn't exist anywhere
    invalidRecords.push({
      record: record,
      reason: `Manager with email '${record.manager_email}' does not exist in the file or in the database`
    });
  }
  
  // Output results
  if (invalidRecords.length === 0) {
    console.log('✅ All records are valid!');
    return true;
  } else {
    console.log(`❌ Found ${invalidRecords.length} invalid records:`);
    console.log('----------------------------------------');
    invalidRecords.forEach((invalid, index) => {
      console.log(`${index + 1}. Record:`);
      console.log(`   Name: ${invalid.record.first_name} ${invalid.record.last_name}`);
      console.log(`   Email: ${invalid.record.email}`);
      if (invalid.record.manager_name) {
        console.log(`   Manager Name: ${invalid.record.manager_name}`);
      }
      if (invalid.record.manager_email) {
        console.log(`   Manager Email: ${invalid.record.manager_email}`);
      }
      console.log(`   Issue: ${invalid.reason}`);
      console.log('----------------------------------------');
    });
    return false;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node validate-csv.js <csv_file_path>');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  try {
    const isValid = await validateCSV(filePath);
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('Error during validation:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { validateCSV };