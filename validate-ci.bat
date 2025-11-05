@echo off
REM Local CI Validation Script
REM Run this script to validate your changes before pushing to GitHub

echo Starting local CI validation...

REM Check if we're in the right directory
if not exist "frontend" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)

if not exist "backend" (
    echo Error: Please run this script from the project root directory
    exit /b 1
)

echo Installing root dependencies...
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install root dependencies
    exit /b %errorlevel%
)

echo Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install backend dependencies
    exit /b %errorlevel%
)
cd ..

echo Installing frontend dependencies...
cd frontend
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install frontend dependencies
    exit /b %errorlevel%
)
cd ..

echo Running backend tests...
cd backend
npm run test
if %errorlevel% neq 0 (
    echo Error: Backend tests failed
    exit /b %errorlevel%
)
cd ..

echo Running frontend tests...
cd frontend
powershell -Command "npm run test:unit -- --run"
if %errorlevel% neq 0 (
    echo Error: Frontend tests failed
    exit /b %errorlevel%
)
cd ..

echo Trying to build frontend...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed
    exit /b %errorlevel%
)
cd ..

echo All validations passed! You can safely push to GitHub.