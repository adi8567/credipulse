#!/usr/bin/env node

/**
 * CreditPulse Quick Start Script
 * Usage: node start.js [backend|frontend|both]
 */

const { spawn } = require('child_process');
const path = require('path');

const command = process.argv[2] || 'both';

function startBackend() {
  console.log('🚀 Starting Backend Server...');
  console.log('📍 Backend running on: http://localhost:5000');
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit'
  });
  backend.on('error', err => {
    console.error('❌ Failed to start backend:', err);
    process.exit(1);
  });
}

function startFrontend() {
  console.log('🚀 Starting Frontend Development Server...');
  console.log('📍 Frontend running on: http://localhost:5173');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit'
  });
  frontend.on('error', err => {
    console.error('❌ Failed to start frontend:', err);
    process.exit(1);
  });
}

console.log('');
console.log('╔════════════════════════════════════════╗');
console.log('║    🎯 CreditPulse - Getting Started    ║');
console.log('╚════════════════════════════════════════╝');
console.log('');

if (command === 'backend') {
  startBackend();
} else if (command === 'frontend') {
  startFrontend();
} else if (command === 'both') {
  console.log('💡 Running both backend and frontend...');
  console.log('💡 Make sure to open this in two terminals, or run:');
  console.log('   Terminal 1: npm start --prefix backend');
  console.log('   Terminal 2: npm start --prefix frontend');
  console.log('');
  startBackend();
} else {
  console.log('❌ Unknown command:', command);
  console.log('');
  console.log('Usage:');
  console.log('  node start.js backend   - Start only backend');
  console.log('  node start.js frontend  - Start only frontend');
  console.log('  node start.js both      - Start both (backend & frontend)');
  console.log('');
  process.exit(1);
}

console.log('');
console.log('ℹ️  Press Ctrl+C to stop the server');
console.log('');
