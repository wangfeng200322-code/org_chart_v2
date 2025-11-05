# Org Chart Management System

A modern organization chart management system built with Vue 3, Node.js, and Neo4j.

## Features

- **Admin Features:**
  - Upload CSV files to batch import employees
  - Manage employee data in Neo4j graph database

- **User Features:**
  - Search employees by first name, last name, or full name
  - View detailed employee information
  - Visualize organization structure with interactive org chart
  - Navigate up and down the hierarchy by clicking nodes

## Tech Stack

### Frontend
- Vue 3 + Vite
- Graphology + Sigma.js (org chart visualization)
- TypeScript (optional but recommended)

### Backend
- Node.js (Express)
- Neo4j AuraDB
- API key authentication (AWS Parameter Store)

### Infrastructure
- Docker & Docker Compose (local development)
- Terraform (AWS EC2 / Aliyun ECS)
- GitHub Actions (CI/CD)

### Testing
- Jest (Unit & API tests)
- Playwright (E2E tests)
- Target: 95% unit test coverage

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