#!/bin/bash

echo "Building frontend..."
npm run build

if [ $? -eq 0 ]; then
    echo "Frontend build successful. Starting docker-compose..."
    cd ../infrastructure
    docker-compose down frontend
    docker-compose up --build
else
    echo "Frontend build failed. Please check the errors above."
    exit 1
fi