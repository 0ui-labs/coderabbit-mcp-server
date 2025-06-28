# CodeRabbit MCP Server

Ein Model Context Protocol (MCP) Server für die Integration mit CodeRabbit AI-powered Code Review.

## Features

### 🔧 Tools

- **Report Generation**: On-demand CodeRabbit Reports für bestimmte Zeiträume
- **Pull Request Analysis**: Analyse spezifischer Pull Requests
- **Review Configuration**: Konfiguration von CodeRabbit Review-Einstellungen
- **Interactive Commands**: Senden von Kommandos an CodeRabbit während Reviews
- **Health Checks**: Überprüfung des CodeRabbit Agent Status
- **Custom Reports**: Erstellung benutzerdefinierter Reports mit Templates

### 📚 Resources

- **Sample Configuration**: Beispiel `.coderabbit.yaml` Konfiguration
- **Commands Reference**: Übersicht aller verfügbaren CodeRabbit Kommandos
- **AST-Grep Examples**: Beispiel AST-Grep Regeln für Code-Analyse
- **Environment Template**: Template für selbst gehostete CodeRabbit `.env` Konfiguration

## Installation

```bash
# Dependencies installieren
npm install

# TypeScript kompilieren
npm run build

# Server starten
npm start
```

## Konfiguration

### Umgebungsvariablen

```bash
# CodeRabbit API Schlüssel (für Reports)
export CODERABBIT_API_KEY="cr-xxxxxxxxxxxxx"

# Optional: Custom API Base URL
export CODERABBIT_BASE_URL="https://api.coderabbit.ai/api/v1"
```

### Claude Desktop Integration

Füge den Server zu deiner Claude Desktop Konfiguration hinzu:

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

**Wichtig:** 
- Verwende absolute Pfade!
- Setze deinen echten API-Key ein
- Starte Claude Desktop nach Änderungen neu

## Verwendung

### Available Tools

#### 1. Report Generation
```typescript
// Generiere einen CodeRabbit Report
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
// Analysiere einen Pull Request
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
// Konfiguriere Review-Einstellungen
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
// Sende Kommando an CodeRabbit
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
// Überprüfe CodeRabbit Agent Status
{
  "tool": "check_health",
  "arguments": {
    "agentUrl": "http://127.0.0.1:8080"
  }
}
```

#### 6. Custom Reports
```typescript
// Erstelle benutzerdefinierten Report
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
- `coderabbit://config/sample` - Beispiel .coderabbit.yaml
- `coderabbit://env/template` - Self-hosted .env Template

#### Documentation
- `coderabbit://commands/help` - Commands Reference
- `coderabbit://tools/astgrep` - AST-Grep Examples

## CodeRabbit Integration

### Interactive Commands

Verwende diese Kommandos in Pull Request Kommentaren:

```bash
# Docstrings generieren
@coderabbitai generate docstrings

# Begründung erklären lassen
@coderabbitai Why do all of these functions need docstrings?

# Regel merken
@coderabbitai always remember to enforce camelCase

# Kontext bereitstellen
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

Für self-hosted CodeRabbit Instanzen:

```bash
# Docker Image pullen
cat coderabbit.json | docker login -u _json_key --password-stdin us-docker.pkg.dev
docker pull <docker-registry>/coderabbit-agent:latest

# Agent starten
docker run --env-file .env --publish 127.0.0.1:8080:8080 <docker-registry>/coderabbit-agent:latest

# Health Check
curl 127.0.0.1:8080/health
```

## Development

### Build
```bash
npm run build
```

### Entwicklungsmodus
```bash
npm run dev
```

### Tests
```bash
npm test
```

## Troubleshooting

### API Key Fehler
- Stelle sicher, dass `CODERABBIT_API_KEY` gesetzt ist
- Überprüfe, dass der API Key gültig ist (beginnt mit `cr-`)

### Agent Connectivity
- Für self-hosted Setups: Stelle sicher, dass der Agent läuft
- Verwende `check_health` Tool um die Verbindung zu testen

### Configuration Issues
- Verwende die bereitgestellten Templates als Ausgangspunkt
- Überprüfe YAML Syntax in .coderabbit.yaml Dateien

## Links

- [CodeRabbit Documentation](https://docs.coderabbit.ai/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [CodeRabbit API Reference](https://api.coderabbit.ai/)

## License

MIT
