#!/usr/bin/env node

// Wrapper script to run Jest tests with ES modules
const { spawn } = require('child_process');
const path = require('path');

// Get the jest binary path
const jestPath = path.resolve(__dirname, 'node_modules', '.bin', 'jest');

// Spawn the jest process with the experimental VM modules flag
const jestProcess = spawn(
  'node',
  [
    '--experimental-vm-modules',
    jestPath,
    '--config',
    './jest.config.cjs',
    ...process.argv.slice(2)
  ],
  {
    stdio: 'inherit',
    cwd: __dirname
  }
);

// Handle process exit
jestProcess.on('close', (code) => {
  process.exit(code);
});

// Handle process errors
jestProcess.on('error', (err) => {
  console.error('Failed to start Jest process:', err);
  process.exit(1);
});