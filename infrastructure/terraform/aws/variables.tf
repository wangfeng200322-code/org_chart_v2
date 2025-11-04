variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "org-chart"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-central-1"
}

variable "environment" {
  description = "Deployment environment (dev/stage/prod)"
  type        = string
  default     = "dev"
}

variable "neo4j_connection_param" {
  description = "SSM parameter name that holds JSON with NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD"
  type        = string
  default     = "/org-chart/neo4j_connection_string"
}

variable "api_keys_param_prefix" {
  description = "SSM parameter path prefix for API keys"
  type        = string
  default     = "/org-chart/api-keys/"
}

variable "instance_type" {
  description = "EC2 instance type (free tier: t2.micro/t3.micro)"
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Existing EC2 key pair name for SSH access"
  type        = string
  default     = null
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to SSH"
  type        = string
  default     = "0.0.0.0/0"
}

variable "allowed_http_cidr" {
  description = "CIDR allowed to access HTTP services"
  type        = string
  default     = "0.0.0.0/0"
}

variable "repo_url" {
  description = "Git repository URL to deploy from"
  type        = string
  default     = "https://github.com/wangfeng200322-code/org_chart_v2.git"
}

variable "repo_branch" {
  description = "Git branch to checkout"
  type        = string
  default     = "main"
}


