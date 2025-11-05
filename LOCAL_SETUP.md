# Local Setup Guide

This guide will help you set up the Org Chart application locally for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:
- Docker and Docker Compose
- Node.js (version 14 or higher)
- npm (usually comes with Node.js)

## Quick Start with Docker (Recommended)

The easiest way to run the application locally is using Docker Compose, which will set up all required services including the backend, frontend, and Neo4j database.

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd org_chart_v2
   ```

2. Navigate to the infrastructure directory:
   ```bash
   cd infrastructure
   ```

3. Start all services with Docker Compose:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - Neo4j Browser: http://localhost:7474 (default credentials: neo4j/testpassword)

5. To stop the services, press `Ctrl+C` in the terminal or run:
   ```bash
   docker-compose down
   ```

## Manual Setup (Advanced)

If you prefer to run services manually without Docker, follow these steps:

### 1. Set up Neo4j Database

You can either:
- Use a local Neo4j installation
- Use Neo4j Desktop
- Run Neo4j with Docker:
  ```bash
  docker run --name neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5
  ```

### 2. Configure Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Neo4j connection details:
   ```
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=password
   ```

5. Start the backend:
   ```bash
   npm run dev
   ```

### 3. Configure Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend:
   ```bash
   npm run dev
   ```

4. Access the application at the URL provided in the terminal (typically http://localhost:5173)

## Configuration Options

### Redis Caching (Optional)

To enable Redis caching:

1. Run Redis locally:
   ```bash
   docker run --name redis -p 6379:6379 redis
   ```

2. Add to your backend `.env` file:
   ```
   REDIS_URL=redis://localhost:6379
   ```

### AWS Integration (Optional)

To use AWS Parameter Store for secrets:

1. Configure AWS credentials using AWS CLI:
   ```bash
   aws configure
   ```

2. Add to your backend `.env` file:
   ```
   AWS_REGION=eu-central-1
   NEO4J_CONNECTION_PARAM=/org-chart/neo4j_connection_string
   API_KEY_PARAM_PATH=/org-chart/api-keys
   ```

## API Keys

For API authentication, you'll need to set up API keys. For local development, the docker-compose.yml file includes a test key:

```
TEST_API_KEY=dev-key
```

Include this key in your API requests in the `X-API-Key` header:
```
X-API-Key: dev-key
```

## Testing

To run tests:

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: If you get port conflicts, modify the ports in `docker-compose.yml` or ensure no other services are using those ports.

2. **Database connection issues**: Make sure Neo4j is running and the connection details in your `.env` file are correct.

3. **Permission errors**: On some systems, you might need to run Docker commands with `sudo`.

4. **AWS credentials**: If using AWS Parameter Store, ensure your AWS credentials are properly configured.

5. **Docker build issues with node_modules**: If you encounter errors related to node_modules during Docker build:
   - Make sure you have .dockerignore files in both backend and frontend directories
   - Clean your Docker build cache:
     ```bash
     docker builder prune
     ```
   - Try building each service individually:
     ```bash
     docker-compose build backend
     docker-compose build frontend
     ```

### Useful Docker Commands

- View running containers:
  ```bash
  docker-compose ps
  ```

- View logs for a specific service:
  ```bash
  docker-compose logs backend
  ```

- Stop services:
  ```bash
  docker-compose down
  ```

- Rebuild services:
  ```bash
  docker-compose up --build
  ```

- Clean Docker build cache:
  ```bash
  docker builder prune
  ```

## Next Steps

Once you have the application running locally:

1. Upload employee data using the CSV upload feature
2. Explore the organization chart visualization
3. Test the search functionality
4. Try navigating through different levels of the organization

For more detailed information about the application features, refer to the main [README.md](README.md) file.