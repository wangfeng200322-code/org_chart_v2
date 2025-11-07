// info: Generating employee CSV files in Node.js
const fs = require('fs');
const path = require('path');
const { Faker, en } = require('@faker-js/faker');  // Import Faker class and locale
const faker = new Faker({ locale: [en] }); // Create Faker instance with locale

function generateEmployeeData(numRecords, fileNumber) {
  const filename = `employees_${fileNumber}.csv`;
  const filepath = path.join('.', filename); // Save to the current directory

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

  for (let i = 0; i < numRecords; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName: firstName, lastName: lastName });
    const phone = faker.phone.number('+1-555-####');
    const homeAddress = faker.location.streetAddress(); // Use faker.location instead of faker.address
    const department = faker.commerce.department();
    const role = faker.person.jobTitle();
    const salary = faker.number.int({ min: 50000, max: 200000 });
    const managerName = faker.person.fullName();
    const managerEmail = faker.internet.email({ firstName: firstName, lastName: lastName });

    const row = [
      firstName,
      lastName,
      email,
      phone,
      homeAddress,
      department,
      role,
      salary,
      managerName,
      managerEmail,
    ];

    csvContent += row.join(',') + '\n';
  }

  fs.writeFileSync(filepath, csvContent, 'utf8');
  console.log(`File ${filename} generated successfully.`);
}

// Generate 10 files, each with 1000 records
for (let i = 1; i <= 10; i++) {
  generateEmployeeData(1000, i);
}

console.log('All CSV files generated successfully!');