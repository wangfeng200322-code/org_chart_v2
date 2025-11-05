# Org Chart Management System

A modern organization chart management system built with Vue 3, Node.js, and Neo4j.

## Features

- **Admin Features:**
  - Upload CSV files to batch import employees
  - Manage employee data in Neo4j graph database
  - Automatic generation of success/failure reports for CSV uploads

- **User Features:**
  - Search employees by first name, last name, or full name
  - View detailed employee information
  - Visualize organization structure with interactive org chart
  - Navigate up and down the hierarchy by clicking nodes

## Performance Improvements

The application now includes a two-tier caching system to improve performance:

1. **In-Memory LRU Cache**: Fast local cache for frequently accessed individual employee records
2. **Redis Cache**: Shared cache for larger objects like organization charts and search results

This caching layer significantly reduces database load and improves response times, especially for frequently accessed data.

## Tech Stack

### Frontend
- Vue 3 + Vite
- Graphology + Sigma.js (org chart visualization)
- TypeScript (optional but recommended)

### Backend
- Node.js (Express)
- Neo4j AuraDB
- Redis (caching)
- API key authentication (AWS Parameter Store)

### Infrastructure
- Docker & Docker Compose (local development)
- Terraform (AWS EC2 / Aliyun ECS)
- GitHub Actions (CI/CD)

### Testing
- Jest (Unit & API tests)
- Playwright (E2E tests)
- Target: 95% unit test coverage

## Getting Started

For detailed instructions on setting up the application locally, please refer to our [Local Setup Guide](LOCAL_SETUP.md).

## CSV Upload Format

The CSV file must include the following columns:
- `first_name` (required)
- `last_name` (required)
- `email` (required, must be valid)
- `phone`
- `home_address`
- `department`
- `role` (required)
- `salary`
- `manager_name` (required for non-CEO employees)
- `manager_email`

See [sample_employees.csv](sample_employees.csv) for a complete example.

## CSV Upload Reporting

When uploading CSV files, the system automatically generates detailed reports:

1. **Success Report**: Contains the identifiers (first name, last name, email) of all successfully processed employee records
2. **Failure Report**: Contains the identifiers and specific error reasons for records that failed validation
3. **Summary Report**: Overall statistics of the upload process

Reports are stored in the `reports` directory and can be accessed via the `/api/reports` endpoint by administrators.

### Report Format

- Success reports are CSV files containing employee identifiers that were successfully processed
- Failure reports are CSV files containing employee identifiers with additional error columns
- Summary reports are text files with overall statistics and any general errors

## Project Structure

```
org_chart_v2/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── app.js
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── views/
│   │   ├── services/
│   │   ├── stores/
│   │   └── main.js
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── infrastructure/
│   ├── terraform/
│   │   ├── aws/
│   │   └── aliyun/
│   └── docker-compose.yml
├── scripts/
│   └── manage-api-keys.js
└── .github/
    └── workflows/
        └── ci.yml
```

## Development Setup

This project uses npm workspaces. To set up the development environment:

1. Install dependencies from the root directory:
   ```bash
   npm install
   ```

2. Or install dependencies separately in each workspace:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Start the development servers:
   ```bash
   # In backend directory
   npm run dev
   
   # In frontend directory
   npm run dev
   ```

## Running Tests

- Run all tests:
  ```bash
  npm test
  ```

- Run backend tests:
  ```bash
  cd backend && npm test
  ```

- Run frontend tests:
  ```bash
  cd frontend && npm test
  ```