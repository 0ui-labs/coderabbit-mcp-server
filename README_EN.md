# CodeRabbit MCP Server

## Overview

The CodeRabbit MCP Server enables integration with CodeRabbit AI for automated code reviews. It provides a variety of tools and resources to streamline the development process.

## Features

### 🔧 Tools

1. **Report Generation**: Create on-demand CodeRabbit reports for specific time periods
2. **Pull Request Analysis**: Analyze specific pull requests for security aspects and other criteria
3. **Review Configuration**: Set up specific settings for code reviews
4. **Interactive Commands**: Send commands to CodeRabbit during the review process
5. **Health Checks**: Check the status of the CodeRabbit environment
6. **Custom Reports**: Create customized reports with specific filters and templates

### 📚 Resources

- Sample configurations for `.coderabbit.yaml`
- Reference for all available CodeRabbit commands
- Examples for AST-Grep rules for code analysis
- Templates for self-hosted environment files

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Compile TypeScript:
   ```bash
   npm run build
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

Make sure the following environment variables are set:

```bash
# CodeRabbit API key (for reports)
export CODERABBIT_API_KEY="cr-xxxxxxxxxxxxx"

# Optional: Custom API Base URL
export CODERABBIT_BASE_URL="https://api.coderabbit.ai/api/v1"
```

### Claude Desktop Integration

Add the server to your Claude Desktop configuration:

**macOS/Linux:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "coderabbit": {
      "command": "node",
      "args": ["/Users/philippbriese/Documents/warp/lokale_MCP_Server/code_rabbit/dist/MCPServer.js"],
      "env": {
        "CODERABBIT_API_KEY": "cr-xxxxxxxxxxxxx"
      }
    }
  }
}
```

**Important:** 
- Use absolute paths!
- Insert your real API key
- Restart Claude Desktop after changes

## Usage

### Available Tools

#### 1. Report Generation
```typescript
// Generate a CodeRabbit report
{
  "tool": "generate_report",
  "arguments": {
    "from": "2024-05-01",
    "to": "2024-05-15"
  }
}
```

#### 2. Pull Request Analysis
```typescript
// Analyze a pull request
{
  "tool": "analyze_pull_request",
  "arguments": {
    "repository": "owner/repo",
    "pullRequestNumber": 123,
    "reviewInstructions": "Focus on security issues"
  }
}
```

#### 3. Review Configuration
```typescript
// Configure review settings
{
  "tool": "configure_review_settings",
  "arguments": {
    "repository": "owner/repo",
    "configuration": {
      "pathInstructions": [
        {
          "path": "**/*.ts",
          "instructions": "Review TypeScript code for type safety"
        }
      ],
      "tools": {
        "astGrep": {
          "essentialRules": true,
          "ruleDirs": ["custom-rules"],
          "packages": ["org/security-rules"]
        }
      }
    }
  }
}
```

#### 4. Interactive Commands
```typescript
// Send command to CodeRabbit
{
  "tool": "send_review_command",
  "arguments": {
    "command": "generate docstrings",
    "context": "Focus on public API functions",
    "targetFiles": ["src/api.ts", "src/utils.ts"]
  }
}
```

#### 5. Health Check
```typescript
// Check CodeRabbit agent status
{
  "tool": "check_health",
  "arguments": {
    "agentUrl": "http://127.0.0.1:8080"
  }
}
```

#### 6. Custom Reports
```typescript
// Create custom report
{
  "tool": "create_custom_report",
  "arguments": {
    "template": "Provide summary of all PR activities and code review discussions",
    "dateRange": {
      "from": "2024-05-01",
      "to": "2024-05-15"
    },
    "filters": {
      "repositories": ["repo1", "repo2"],
      "authors": ["alice", "bob"],
      "includeOnlyMerged": true,
      "excludeBots": true
    }
  }
}
```

### Available Resources

#### Configuration Templates
- `coderabbit://config/sample` - Sample .coderabbit.yaml
- `coderabbit://env/template` - Self-hosted .env template

#### Documentation
- `coderabbit://commands/help` - Commands reference
- `coderabbit://tools/astgrep` - AST-Grep examples

## CodeRabbit Integration

### Interactive Commands

Use these commands in pull request comments:

```bash
# Generate docstrings
@coderabbitai generate docstrings

# Ask for explanation
@coderabbitai Why do all of these functions need docstrings?

# Remember rule
@coderabbitai always remember to enforce camelCase

# Provide context
@coderabbitai do not complain about lack of error handling here, it is handled higher up the execution stack.
```

### Configuration Files

#### .coderabbit.yaml
```yaml
reviews:
  path_instructions:
    - path: "**/*.js"
      instructions: |
        Review the JavaScript code against the Google JavaScript style guide
    - path: "tests/**.*"
      instructions: |
        Review unit test code for Mocha best practices

  tools:
    ast-grep:
      essential_rules: true
      rule_dirs: ["custom-rules"]
      packages: ["org/awesome-package"]

code_generation:
  docstrings:
    path_instructions:
      - path: "**/*.ts"
        instructions: |
          End all docstrings with "Auto-generated by CodeRabbit."
```

### Self-Hosted Setup

For self-hosted CodeRabbit instances:

```bash
# Pull Docker image
cat coderabbit.json | docker login -u _json_key --password-stdin us-docker.pkg.dev
docker pull <docker-registry>/coderabbit-agent:latest

# Start agent
docker run --env-file .env --publish 127.0.0.1:8080:8080 <docker-registry>/coderabbit-agent:latest

# Health check
curl 127.0.0.1:8080/health
```

## Development

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Tests
```bash
npm test
```

## Troubleshooting

### API Key Errors
- Make sure `CODERABBIT_API_KEY` is set
- Verify that the API key is valid (starts with `cr-`)

### Agent Connectivity
- For self-hosted setups: Make sure the agent is running
- Use `check_health` tool to test the connection

### Configuration Issues
- Use the provided templates as a starting point
- Check YAML syntax in .coderabbit.yaml files

## Architecture

The MCP Server acts as a bridge between MCP clients (like Claude Desktop) and the CodeRabbit API. It provides:

- **Tools**: Interactive functions that can be called by the client
- **Resources**: Static content like configuration templates and documentation
- **Secure Communication**: All API calls are handled server-side with proper authentication

### Tool Flow
1. Client requests a tool execution
2. Server validates input parameters
3. Server makes authenticated API calls to CodeRabbit
4. Server processes and returns formatted results

### Resource Flow
1. Client requests a resource
2. Server returns static content (configs, docs, examples)
3. Content can be used directly or as templates

## API Reference

### Tool Parameters

All tools accept structured JSON input with validation:

- **Dates**: ISO format (YYYY-MM-DD)
- **Repository names**: format "owner/repo"
- **File paths**: relative to repository root
- **Commands**: natural language instructions for CodeRabbit

### Error Handling

The server provides detailed error messages for:
- Invalid API keys
- Network connectivity issues
- Malformed requests
- CodeRabbit service errors

## Links

- [CodeRabbit Documentation](https://docs.coderabbit.ai/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [CodeRabbit API Reference](https://api.coderabbit.ai/)

## License

MIT
