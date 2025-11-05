# Backend

## Features

- RESTful API for employee data
- CSV upload and processing
- Neo4j graph database integration
- API key authentication
- **Caching layer with in-memory LRU and Redis support**

## Caching

The application implements a two-tier caching system:

1. **In-Memory LRU Cache**: Fast local cache for frequently accessed individual employee records
2. **Redis Cache**: Shared cache for larger objects like organization charts and search results

### Configuration

To enable Redis caching, set the `REDIS_URL` environment variable:

```
REDIS_URL=redis://localhost:6379
```

If `REDIS_URL` is not set, the application will only use the in-memory cache.

### Cache Keys

- `employee:{email}` - Individual employee records (5 min TTL)
- `orgchart:{email}:{depth}` - Organization charts (2 min TTL)
- `search:{query}:{limit}:{offset}` - Search results (2 min TTL)
- `middleware:{url}` - Responses cached by middleware (5 min TTL)

### TTL (Time-To-Live)

Different cache entries have different TTL values based on how frequently they change:
- Employee data: 5 minutes
- Organization charts: 2 minutes
- Search results: 2 minutes
- Middleware cached responses: 5 minutes

## API Endpoints

### Employee Management
- `GET /api/employees/search?q={query}` - Search employees
- `GET /api/employees/{email}` - Get employee details
- `GET /api/org-chart?email={email}` - Get organization chart
- `POST /api/upload/csv` - Upload employee data via CSV

### Health Check
- `GET /health` - Health status of the service

## Authentication

All API endpoints require an API key in the `X-API-Key` header.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `REDIS_URL` - Redis connection URL (optional)
- `NEO4J_URI` - Neo4j database URI
- `NEO4J_USER` - Neo4j username
- `NEO4J_PASSWORD` - Neo4j password
- `AWS_REGION` - AWS region for Parameter Store
- `API_KEY_PARAM_PATH` - Path to API keys in Parameter Store