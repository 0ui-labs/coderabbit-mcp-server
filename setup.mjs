#!/usr/bin/env node

/**
 * Setup Script für CodeRabbit MCP Server
 * 
 * Automatisiert die Installation und Konfiguration für Claude Desktop
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { platform } from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getClaudeConfigPath() {
  const home = homedir();
  
  if (platform === 'win32') {
    return join(home, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
  } else if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    // Linux (Claude Desktop not officially supported yet)
    return join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

function ensureDirectoryExists(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    log(`✅ Created directory: ${dir}`, 'green');
  }
}

function createOrUpdateClaudeConfig() {
  const configPath = getClaudeConfigPath();
  const serverPath = join(__dirname, 'dist', 'MCPServer.js');
  
  log('\n🔧 Setting up Claude Desktop Configuration...', 'cyan');
  
  ensureDirectoryExists(configPath);
  
  let config = { mcpServers: {} };
  
  // Load existing config if it exists
  if (existsSync(configPath)) {
    try {
      const existingConfig = readFileSync(configPath, 'utf8');
      config = JSON.parse(existingConfig);
      log(`📖 Loaded existing config from: ${configPath}`, 'blue');
    } catch (error) {
      log(`⚠️  Warning: Could not parse existing config, creating new one`, 'yellow');
      log(`   Error: ${error.message}`, 'yellow');
    }
  } else {
    log(`📝 Creating new config at: ${configPath}`, 'blue');
  }
  
  // Ensure mcpServers exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Add or update CodeRabbit server configuration
  config.mcpServers.coderabbit = {
    command: 'node',
    args: [serverPath],
    env: {
      CODERABBIT_API_KEY: 'cr-your-api-key-here'
    }
  };
  
  // Write updated config
  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    log(`✅ Updated Claude Desktop config successfully!`, 'green');
    log(`📍 Config location: ${configPath}`, 'blue');
    
    return true;
  } catch (error) {
    log(`❌ Failed to write config: ${error.message}`, 'red');
    return false;
  }
}

function displayPostSetupInstructions() {
  log('\n🎯 Setup Complete! Next Steps:', 'magenta');
  log('', 'reset');
  log('1. 🔑 Set your CodeRabbit API key:', 'cyan');
  log('   Edit the config file and replace "cr-your-api-key-here"', 'reset');
  log('   with your actual CodeRabbit API key', 'reset');
  log('', 'reset');
  log('2. 🔄 Restart Claude Desktop completely', 'cyan');
  log('', 'reset');
  log('3. ✅ Verify the integration:', 'cyan');
  log('   - Look for the tools icon in Claude Desktop', 'reset');
  log('   - Try asking: "What CodeRabbit tools are available?"', 'reset');
  log('', 'reset');
  log('🔧 Troubleshooting:', 'yellow');
  log('- Check Claude Desktop logs: ~/Library/Logs/Claude/mcp*.log', 'reset');
  log('- Run test: npm test', 'reset');
  log('- Ensure the server builds: npm run build', 'reset');
}

function checkPrerequisites() {
  log('🔍 Checking prerequisites...', 'cyan');
  
  // Check if dist directory exists
  const distPath = join(__dirname, 'dist');
  if (!existsSync(distPath)) {
    log('❌ dist/ directory not found. Please run "npm run build" first.', 'red');
    return false;
  }
  
  // Check if MCPServer.js exists
  const serverPath = join(distPath, 'MCPServer.js');
  if (!existsSync(serverPath)) {
    log('❌ MCPServer.js not found. Please run "npm run build" first.', 'red');
    return false;
  }
  
  log('✅ Prerequisites check passed', 'green');
  return true;
}

async function main() {
  log('🚀 CodeRabbit MCP Server Setup', 'bright');
  log('===============================', 'bright');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }
  
  // Platform check
  log(`\n🖥️  Platform: ${platform}`, 'blue');
  if (platform === 'linux') {
    log('⚠️  Note: Claude Desktop is not officially available for Linux yet', 'yellow');
    log('   You can still use this server with other MCP clients', 'yellow');
  }
  
  // Setup Claude Desktop configuration
  const success = createOrUpdateClaudeConfig();
  
  if (success) {
    displayPostSetupInstructions();
  } else {
    log('\n❌ Setup failed. Please check the errors above.', 'red');
    process.exit(1);
  }
  
  log('\n🎉 Setup completed successfully!', 'green');
}

// Run setup
main().catch(error => {
  log(`\n❌ Setup failed with error: ${error.message}`, 'red');
  process.exit(1);
});
