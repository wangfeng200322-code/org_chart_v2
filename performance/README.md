# Performance Testing Tools

This directory contains tools for generating and validating CSV files for performance testing of the org-chart application.

## CSV Generator

The `csv-generator.js` script generates realistic employee CSV files with proper organizational hierarchies.

### Features

1. **Database Integration**: Connects to the Neo4j database to find existing employees
2. **Realistic Structure**: 
   - 20% of employees are top-level managers (no manager)
   - 30% of employees report to existing employees in the database
   - 50% of employees report to managers created in the same file
3. **Proper Relationships**: Ensures referential integrity between employees and managers

### Usage

```bash
cd performance
node csv-generator.js
```

This will generate 10 CSV files with 1000 records each.

## CSV Validator

The `validate-csv.js` script validates CSV files to ensure all managers exist either in the same file or in the database.

### Features

1. **File Validation**: Checks for required fields and proper email formats
2. **Manager Validation**: Verifies that all managers referenced in the file exist either:
   - In the same file
   - In the Neo4j database
3. **Detailed Reporting**: Lists all invalid records with specific reasons

### Usage

```bash
cd performance
node validate-csv.js <csv_file_path>
```

Example:
```bash
node validate-csv.js employees_1.csv
```

### Return Codes

- `0`: All records are valid
- `1`: Invalid records found or error occurred

## Requirements

- Node.js
- Running Neo4j database (as configured in docker-compose.yml)
- csv-parse package (install with `npm install csv-parse`)

## Database Connection

The scripts use the same database credentials as defined in the docker-compose.yml file:
- URI: `bolt://localhost:7687`
- User: `neo4j`
- Password: `orgchart-neo4j-strong-password`

These can be overridden with environment variables:
- `NEO4J_URI`
- `NEO4J_USER`
- `NEO4J_PASSWORD`