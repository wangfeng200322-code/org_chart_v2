# Terraform AWS Scaffold

This minimal scaffold creates:
- VPC with a public subnet
- Internet gateway and route table
- Reads Neo4j password from SSM Parameter Store (data source)

Variables:
- `project_name` (default: org-chart)
- `environment` (default: dev)
- `aws_region` (default: eu-central-1)
- `neo4j_uri`, `neo4j_user`, `neo4j_password_ssm_path`

Usage:
```
terraform init
terraform plan -var neo4j_uri=... -var neo4j_user=... -var neo4j_password_ssm_path=/path/to/param
```

Next steps (future modules):
- ECS cluster & services for backend/frontend
- ALB with target groups and listeners
- SSM Parameters/Secrets for app config and credentials

