# Local CI Validation Script
# Run this script to validate your changes before pushing to GitHub

Write-Host "Starting local CI validation..." -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Function to run a command and check for errors
function Run-Command {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "Running $Description..." -ForegroundColor Yellow
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: $Description failed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

try {
    # Install root dependencies if not already installed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing root dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Install backend dependencies if not already installed
    if (-not (Test-Path "backend/node_modules")) {
        Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
        Set-Location -Path "backend"
        npm install
        Set-Location -Path ".."
    }
    
    # Install frontend dependencies if not already installed
    if (-not (Test-Path "frontend/node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        Set-Location -Path "frontend"
        npm install
        Set-Location -Path ".."
    }
    
    # Run backend tests (skip DB dependent)
    $env:SKIP_DB_TESTS = '1'
    $env:AWS_REGION = 'eu-central-1'
    Run-Command "Set-Location -Path 'backend'; npm run test" "backend tests (skip DB dependent)"
    Set-Location -Path ".."
    
    # Run frontend tests
    Run-Command "Set-Location -Path 'frontend'; npm run test:unit -- --run" "frontend unit tests"
    Set-Location -Path ".."
    
    # Try to build frontend
    Run-Command "Set-Location -Path 'frontend'; npm run build" "frontend build"
    Set-Location -Path ".."
    
    Write-Host "All validations passed! You can safely push to GitHub." -ForegroundColor Green
}
catch {
    Write-Host "Validation failed: $_" -ForegroundColor Red
    exit 1
}