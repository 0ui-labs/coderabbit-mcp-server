#!/usr/bin/env node

// Build und start script für den MCP Server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build das TypeScript Projekt
console.log('Building CodeRabbit MCP Server...');
const buildProcess = spawn('npx', ['tsc'], {
  cwd: join(__dirname, '..'),
  stdio: 'inherit'
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('Build successful! Starting server...');
    
    // Starte den MCP Server
    const serverProcess = spawn('node', ['dist/MCPServer.js'], {
      cwd: join(__dirname, '..'),
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'production'
      }
    });

    serverProcess.on('close', (serverCode) => {
      console.log(`Server exited with code ${serverCode}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down server...');
      serverProcess.kill('SIGINT');
    });

  } else {
    console.error('Build failed!');
    process.exit(1);
  }
});
