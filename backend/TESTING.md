# Running integration tests (Neo4j via SSM)

This project supports running the backend test suite against a remote Neo4j (AuraDB) whose credentials are stored in AWS SSM Parameter Store.

Prerequisites
- AWS credentials configured locally (shared credentials file `~/.aws/credentials` or environment variables).
- The SSM parameter (default `/org-chart/neo4j_connection_string`) must exist and contain JSON like:

  {
    "NEO4J_URI": "neo4j+s://...",
    "NEO4J_USER": "neo4j",
    "NEO4J_PASSWORD": "..."
  }

- `AWS_REGION` environment variable set to the region where the parameter lives (e.g. `eu-central-1`).

Run tests
1. Make sure `AWS_REGION` is exported in your shell (PowerShell example):

```powershell
$env:AWS_REGION = 'eu-central-1'
```

2. Remove the skip flag (if previously set) and run tests from `backend`:

```powershell
Remove-Item Env:\SKIP_DB_TESTS -ErrorAction SilentlyContinue
npm test
```

Notes
- CI sets `AWS_REGION=eu-central-1` so tests in CI will locate the parameter automatically.
- AWS credentials should never be stored in the repo or in `.env` — use the shared credentials file or environment variables.
- If you see region-related errors, ensure `AWS_REGION` is set and credentials are available.
