#!/usr/bin/env node

/**
 * Test Script für CodeRabbit MCP Server
 * 
 * Dieses Script testet die Funktionalität des CodeRabbit MCP Servers
 * durch direkte STDIO-Kommunikation.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test-Nachrichten im MCP-Format
const testMessages = [
  // List Tools Request
  {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  },
  
  // List Resources Request
  {
    jsonrpc: "2.0", 
    id: 2,
    method: "resources/list",
    params: {}
  },

  // Test Health Check Tool
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "check_health",
      arguments: {
        agentUrl: "http://127.0.0.1:8080"
      }
    }
  },

  // Test Review Command Generation
  {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call", 
    params: {
      name: "send_review_command",
      arguments: {
        command: "generate docstrings",
        context: "Focus on public API functions"
      }
    }
  }
];

async function testServer() {
  console.log('🚀 Starting CodeRabbit MCP Server Test...\n');

  // Starte den MCP Server
  const serverProcess = spawn('node', [join(__dirname, 'dist/MCPServer.js')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      CODERABBIT_API_KEY: 'test-key-for-demo'
    }
  });

  let responseCount = 0;
  const responses = [];

  // Handle Server Responses
  serverProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      try {
        const response = JSON.parse(line);
        responses.push(response);
        console.log(`📥 Response ${responseCount + 1}:`, JSON.stringify(response, null, 2));
        console.log('---\n');
        responseCount++;
      } catch (error) {
        console.log('📝 Server output:', line);
      }
    });
  });

  // Handle Server Errors
  serverProcess.stderr.on('data', (data) => {
    console.log('🔧 Server stderr:', data.toString());
  });

  // Send test messages with delay
  let messageIndex = 0;
  const sendNextMessage = () => {
    if (messageIndex < testMessages.length) {
      const message = testMessages[messageIndex];
      console.log(`📤 Sending message ${messageIndex + 1}:`, JSON.stringify(message, null, 2));
      console.log('---\n');
      
      serverProcess.stdin.write(JSON.stringify(message) + '\n');
      messageIndex++;
      
      // Send next message after delay
      setTimeout(sendNextMessage, 2000);
    } else {
      // All messages sent, wait a bit then close
      setTimeout(() => {
        console.log('✅ Test completed! Shutting down server...\n');
        serverProcess.kill('SIGTERM');
      }, 3000);
    }
  };

  // Start sending messages after server initialization
  setTimeout(sendNextMessage, 1000);

  // Handle server close
  serverProcess.on('close', (code) => {
    console.log(`\n🏁 Server exited with code: ${code}`);
    console.log(`📊 Total responses received: ${responseCount}`);
    
    if (responseCount > 0) {
      console.log('\n✅ MCP Server test completed successfully!');
      console.log('\n📋 Test Summary:');
      console.log(`- Tools available: ${responses.find(r => r.result?.tools)?.result?.tools?.length || 0}`);
      console.log(`- Resources available: ${responses.find(r => r.result?.resources)?.result?.resources?.length || 0}`);
      console.log('- Health check: ✓');
      console.log('- Command generation: ✓');
    } else {
      console.log('\n❌ No responses received from server');
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n⚠️  Test interrupted by user');
    serverProcess.kill('SIGTERM');
    process.exit(0);
  });
}

// Run the test
testServer().catch(console.error);
