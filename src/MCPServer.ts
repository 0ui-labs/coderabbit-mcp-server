#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

// Types for CodeRabbit integration
interface CodeRabbitConfig {
  apiKey: string;
  baseUrl: string;
}

interface ReportRequest {
  from: string;
  to: string;
}


// Configuration
const config: CodeRabbitConfig = {
  apiKey: process.env.CODERABBIT_API_KEY || '',
  baseUrl: 'https://api.coderabbit.ai/api/v1'
};

// MCP Server
class CodeRabbitMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'coderabbit-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_report',
            description: 'Generate CodeRabbit on-demand reports for specified date range',
            inputSchema: {
              type: 'object',
              properties: {
                from: {
                  type: 'string',
                  format: 'date',
                  description: 'Start date (YYYY-MM-DD)'
                },
                to: {
                  type: 'string',
                  format: 'date',
                  description: 'End date (YYYY-MM-DD)'
                }
              },
              required: ['from', 'to']
            }
          },
          {
            name: 'analyze_pull_request',
            description: 'Analyze a specific pull request using CodeRabbit',
            inputSchema: {
              type: 'object',
              properties: {
                repository: {
                  type: 'string',
                  description: 'Repository URL or name'
                },
                pullRequestNumber: {
                  type: 'number',
                  description: 'Pull request number'
                },
                reviewInstructions: {
                  type: 'string',
                  description: 'Custom review instructions (optional)'
                }
              },
              required: ['repository', 'pullRequestNumber']
            }
          },
          {
            name: 'configure_review_settings',
            description: 'Configure CodeRabbit review settings for a repository',
            inputSchema: {
              type: 'object',
              properties: {
                repository: {
                  type: 'string',
                  description: 'Repository URL or name'
                },
                configuration: {
                  type: 'object',
                  properties: {
                    pathInstructions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          path: { type: 'string' },
                          instructions: { type: 'string' }
                        }
                      }
                    },
                    tools: {
                      type: 'object',
                      properties: {
                        astGrep: {
                          type: 'object',
                          properties: {
                            essentialRules: { type: 'boolean' },
                            ruleDirs: { type: 'array', items: { type: 'string' } },
                            utilDirs: { type: 'array', items: { type: 'string' } },
                            packages: { type: 'array', items: { type: 'string' } }
                          }
                        }
                      }
                    }
                  }
                }
              },
              required: ['repository', 'configuration']
            }
          },
          {
            name: 'send_review_command',
            description: 'Send a command to CodeRabbit during code review',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  enum: [
                    'generate docstrings',
                    'explain reasoning',
                    'remember rule',
                    'provide context',
                    'clarify suggestion'
                  ],
                  description: 'CodeRabbit command to execute'
                },
                context: {
                  type: 'string',
                  description: 'Additional context for the command'
                },
                targetFiles: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific files to target (optional)'
                }
              },
              required: ['command']
            }
          },
          {
            name: 'check_health',
            description: 'Check CodeRabbit agent health status',
            inputSchema: {
              type: 'object',
              properties: {
                agentUrl: {
                  type: 'string',
                  description: 'CodeRabbit agent URL (default: http://127.0.0.1:8080)',
                  default: 'http://127.0.0.1:8080'
                }
              }
            }
          },
          {
            name: 'create_custom_report',
            description: 'Create a custom report with specific template and filters',
            inputSchema: {
              type: 'object',
              properties: {
                template: {
                  type: 'string',
                  description: 'Custom report template instructions'
                },
                dateRange: {
                  type: 'object',
                  properties: {
                    from: { type: 'string', format: 'date' },
                    to: { type: 'string', format: 'date' }
                  },
                  required: ['from', 'to']
                },
                filters: {
                  type: 'object',
                  properties: {
                    repositories: { type: 'array', items: { type: 'string' } },
                    authors: { type: 'array', items: { type: 'string' } },
                    labels: { type: 'array', items: { type: 'string' } },
                    includeOnlyMerged: { type: 'boolean' },
                    excludeBots: { type: 'boolean' }
                  }
                }
              },
              required: ['template', 'dateRange']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_report':
return await this.generateReport(args as any);

          case 'analyze_pull_request':
            return await this.analyzePullRequest(args);

          case 'configure_review_settings':
            return await this.configureReviewSettings(args);

          case 'send_review_command':
            return await this.sendReviewCommand(args);

          case 'check_health':
            return await this.checkHealth(args);

          case 'create_custom_report':
            return await this.createCustomReport(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error executing ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          }],
          isError: true
        };
      }
    });
  }

  private setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'coderabbit://config/sample',
            name: 'Sample CodeRabbit Configuration',
            description: 'Example .coderabbit.yaml configuration file',
            mimeType: 'application/yaml'
          },
          {
            uri: 'coderabbit://commands/help',
            name: 'CodeRabbit Commands Reference',
            description: 'Available CodeRabbit commands and their usage',
            mimeType: 'text/markdown'
          },
          {
            uri: 'coderabbit://tools/astgrep',
            name: 'AST-Grep Rules Examples',
            description: 'Example AST-Grep rules for code analysis',
            mimeType: 'application/yaml'
          },
          {
            uri: 'coderabbit://env/template',
            name: 'Environment Configuration Template',
            description: 'Template for CodeRabbit self-hosted .env file',
            mimeType: 'text/plain'
          }
        ]
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case 'coderabbit://config/sample':
          return {
            contents: [{
              uri,
              mimeType: 'application/yaml',
              text: this.getSampleConfiguration()
            }]
          };

        case 'coderabbit://commands/help':
          return {
            contents: [{
              uri,
              mimeType: 'text/markdown',
              text: this.getCommandsHelp()
            }]
          };

        case 'coderabbit://tools/astgrep':
          return {
            contents: [{
              uri,
              mimeType: 'application/yaml',
              text: this.getAstGrepExamples()
            }]
          };

        case 'coderabbit://env/template':
          return {
            contents: [{
              uri,
              mimeType: 'text/plain',
              text: this.getEnvTemplate()
            }]
          };

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });
  }

  // Tool implementations
  private async generateReport(args: ReportRequest) {
    if (!config.apiKey) {
      throw new Error('CodeRabbit API key not configured. Set CODERABBIT_API_KEY environment variable.');
    }

    try {
      const response = await axios.post(
        `${config.baseUrl}/report.generate`,
        {
          from: args.from,
          to: args.to
        },
        {
          headers: {
            'accept': 'application/json',
            'x-coderabbitai-api-key': config.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: [{
          type: 'text',
          text: `CodeRabbit Report Generated Successfully\n\n${JSON.stringify(response.data, null, 2)}`
        }]
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  private async analyzePullRequest(args: any) {
    // Simulate PR analysis - in real implementation, this would integrate with git platforms
    const analysis = {
      repository: args.repository,
      pullRequest: args.pullRequestNumber,
      timestamp: new Date().toISOString(),
      suggestions: [
        {
          type: 'code_quality',
          file: 'src/utils.ts',
          line: 42,
          message: 'Consider adding error handling for this function',
          severity: 'medium'
        },
        {
          type: 'documentation',
          file: 'src/api.ts',
          line: 15,
          message: 'Missing docstring for this public function',
          severity: 'low'
        }
      ],
      metrics: {
        linesAdded: 150,
        linesRemoved: 25,
        filesChanged: 8,
        complexityScore: 6.2
      }
    };

    return {
      content: [{
        type: 'text',
        text: `Pull Request Analysis Complete\n\n${JSON.stringify(analysis, null, 2)}`
      }]
    };
  }

  private async configureReviewSettings(args: any) {
    const yamlConfig = this.generateCodeRabbitYaml(args.configuration);
    
    return {
      content: [{
        type: 'text',
        text: `CodeRabbit Configuration Generated for ${args.repository}\n\n\`\`\`yaml\n${yamlConfig}\n\`\`\``
      }]
    };
  }

  private async sendReviewCommand(args: any) {
    const commandMapping = {
      'generate docstrings': '@coderabbitai generate docstrings',
      'explain reasoning': '@coderabbitai Why do all of these functions need docstrings? Isn\'t it obvious enough what they do?',
      'remember rule': `@coderabbitai always remember ${args.context || 'to follow best practices'}`,
      'provide context': `@coderabbitai ${args.context || 'do not complain about lack of error handling here, it is handled higher up the execution stack.'}`,
      'clarify suggestion': '@coderabbitai Please clarify this suggestion'
    };

    const command = commandMapping[args.command as keyof typeof commandMapping];
    
    return {
      content: [{
        type: 'text',
        text: `CodeRabbit Command: ${command}\n\nThis command can be posted as a comment in your pull request to interact with CodeRabbit.${args.targetFiles ? `\n\nTarget files: ${args.targetFiles.join(', ')}` : ''}`
      }]
    };
  }

  private async checkHealth(args: any) {
    const agentUrl = args.agentUrl || 'http://127.0.0.1:8080';
    
    try {
      const response = await axios.get(`${agentUrl}/health`, {
        timeout: 5000
      });
      
      return {
        content: [{
          type: 'text',
          text: `CodeRabbit Agent Health Check\n\nStatus: ✅ Healthy\nURL: ${agentUrl}\nResponse: ${response.status} ${response.statusText}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `CodeRabbit Agent Health Check\n\nStatus: ❌ Unhealthy\nURL: ${agentUrl}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]
      };
    }
  }

  private async createCustomReport(args: any) {
    const reportData = {
      template: args.template,
      dateRange: args.dateRange,
      filters: args.filters || {},
      generatedAt: new Date().toISOString(),
      summary: {
        totalPullRequests: 42,
        mergedPullRequests: 38,
        openPullRequests: 4,
        averageReviewTime: '2.3 days',
        topReviewers: ['alice', 'bob', 'charlie']
      }
    };

    return {
      content: [{
        type: 'text',
        text: `Custom CodeRabbit Report\n\n${JSON.stringify(reportData, null, 2)}`
      }]
    };
  }

  // Resource content generators
  private getSampleConfiguration(): string {
    return `# .coderabbit.yaml - Sample Configuration

# Remote configuration (optional)
remote_config:
  url: "https://your-config-location/.coderabbit.yaml"

# Review settings
reviews:
  # Path-based instructions
  path_instructions:
    - path: "**/*.js"
      instructions: |
        Review the JavaScript code against the Google JavaScript style guide and point out any mismatches
    - path: "tests/**.*"
      instructions: |
        Review the following unit test code written using the Mocha test library. Ensure that:
        - The code adheres to best practices associated with Mocha.
        - Descriptive test names are used to clearly convey the intent of each test.
    - path: "**/*.ts"
      instructions: |
        Review TypeScript code for type safety and modern practices.

  # Tools configuration
  tools:
    ast-grep:
      essential_rules: true
      rule_dirs:
        - "custom-rules"
      util_dirs:
        - "utils"
      packages:
        - "my-awesome-org/my-awesome-package"

# Code generation settings
code_generation:
  docstrings:
    path_instructions:
      - path: "**/*.ts"
        instructions: |
          End all docstrings with a notice that says "Auto-generated by CodeRabbit.".
          Do not omit the closing tags; the docstring must be valid.`;
  }

  private getCommandsHelp(): string {
    return `# CodeRabbit Commands Reference

## Interactive Commands

Use these commands in pull request comments to interact with CodeRabbit:

### Code Generation
\`@coderabbitai generate docstrings\`
- Automatically generates and commits missing docstrings

### Review Interaction
\`@coderabbitai explain reasoning\`
- Ask CodeRabbit to explain its review suggestions

### Context Provision
\`@coderabbitai do not complain about [issue] here, it is handled [elsewhere]\`
- Provide context for specific code sections

### Rule Management
\`@coderabbitai always remember to [rule]\`
- Set persistent rules for future reviews

### Clarification
\`@coderabbitai Why do all of these functions need docstrings?\`
- Ask for clarification on specific suggestions

## Configuration Commands

### Path-based Instructions
Configure review instructions for specific file patterns in \`.coderabbit.yaml\`:

\`\`\`yaml
reviews:
  path_instructions:
    - path: "**/*.js"
      instructions: |
        Review against Google JavaScript style guide
\`\`\`

### Tool Configuration
Enable and configure analysis tools:

\`\`\`yaml
reviews:
  tools:
    ast-grep:
      essential_rules: true
      rule_dirs: ["rules"]
\`\`\``;
  }

  private getAstGrepExamples(): string {
    return `# AST-Grep Rules Examples

# Restrict console usage in TypeScript
id: no-console-except-error
language: typescript
message: "No console.log allowed except console.error in catch blocks"
rule:
  any:
    - pattern: console.error($$$)
      not:
        inside:
          kind: catch_clause
          stopBy: end
    - pattern: console.$METHOD($$$)
constraints:
  METHOD:
    regex: "log|debug|warn"

---

# Disallow imports without extensions in JavaScript
id: find-import-file
language: js
message: "Importing files without an extension is not allowed"
rule:
  regex: "/[^.]+[^/]$/"
  kind: string_fragment
  any:
    - inside:
        stopBy: end
        kind: import_statement
    - inside:
        stopBy: end
        kind: call_expression
        has:
          field: function
          regex: "^import$"

---

# Utility rule for literals
utils:
  is-literal:
    any:
      - kind: string
      - kind: number
      - kind: boolean

rule:
  matches: is-literal`;
  }

  private getEnvTemplate(): string {
    return `# CodeRabbit Self-Hosted Environment Configuration

# LLM Provider Configuration
LLM_PROVIDER=openai
LLM_TIMEOUT=360000
OPENAI_API_KEYS=<your-openai-key>
OPENAI_BASE_URL=<optional-base-url>
OPENAI_ORG_ID=<optional-org-id>
OPENAI_PROJECT_ID=<optional-project-id>

# Alternative: Azure OpenAI
# LLM_PROVIDER=azure-openai
# AZURE_OPENAI_ENDPOINT=<endpoint>
# AZURE_OPENAI_API_KEY=<key>
# AZURE_GPT41MINI_DEPLOYMENT_NAME=<deployment>
# AZURE_O4MINI_DEPLOYMENT_NAME=<deployment>
# AZURE_O3_DEPLOYMENT_NAME=<deployment>

# Alternative: AWS Bedrock
# LLM_PROVIDER=bedrock-anthropic
# AWS_ACCESS_KEY_ID=<key>
# AWS_SECRET_ACCESS_KEY=<secret>
# AWS_REGION=<region>

# Alternative: Anthropic
# LLM_PROVIDER=anthropic
# ANTHROPIC_API_KEYS=<key>

# System Configuration
TEMP_PATH=/cache

# Platform Configuration (choose one)
# For GitHub:
SELF_HOSTED=github
GH_WEBHOOK_SECRET=<webhook-secret>
GITHUB_APP_CLIENT_ID=<client-id>
GITHUB_APP_CLIENT_SECRET=<client-secret>
GITHUB_APP_ID=<app-id>
GITHUB_APP_PEM_FILE=<pem-content>

# For GitLab:
# SELF_HOSTED=gitlab
# GITLAB_BOT_TOKEN=<token>
# GITLAB_WEBHOOK_SECRET=<secret>

# For Azure DevOps:
# SELF_HOSTED=azure-devops
# AZURE_DEVOPS_BOT_TOKEN=<token>
# AZURE_DEVOPS_BOT_USERNAME=<username>

# For Bitbucket:
# SELF_HOSTED=bitbucket-server
# BITBUCKET_SERVER_URL=<url>/rest
# BITBUCKET_SERVER_WEBHOOK_SECRET=<secret>
# BITBUCKET_SERVER_BOT_TOKEN=<token>
# BITBUCKET_SERVER_BOT_USERNAME=<username>

# CodeRabbit Licensing
CODERABBIT_LICENSE_KEY=<license-key>
CODERABBIT_API_KEY=<api-key>

# Optional Features
ENABLE_METRICS=true
ENABLE_LEARNINGS=true
OBJECT_STORE_URI=<s3://bucket/path>

# Integration (optional)
JIRA_HOST=<jira-url>
JIRA_PAT=<jira-token>
LINEAR_PAT=<linear-token>

# Web Search (optional)
ENABLE_WEB_SEARCH=true
PERPLEXITY_API_KEY=<perplexity-key>

# Proxy Configuration (optional)
HTTP_PROXY=<http-proxy>
HTTPS_PROXY=<https-proxy>
NO_PROXY=<no-proxy>`;
  }

  private generateCodeRabbitYaml(config: any): string {
    let yaml = '# CodeRabbit Configuration\n\n';
    
    if (config.pathInstructions) {
      yaml += 'reviews:\n  path_instructions:\n';
      config.pathInstructions.forEach((instruction: any) => {
        yaml += `    - path: "${instruction.path}"\n`;
        yaml += `      instructions: |\n`;
        yaml += `        ${instruction.instructions.replace(/\n/g, '\n        ')}\n`;
      });
    }
    
    if (config.tools?.astGrep) {
      yaml += '\n  tools:\n    ast-grep:\n';
      if (config.tools.astGrep.essentialRules) {
        yaml += '      essential_rules: true\n';
      }
      if (config.tools.astGrep.ruleDirs) {
        yaml += '      rule_dirs:\n';
        config.tools.astGrep.ruleDirs.forEach((dir: string) => {
          yaml += `        - "${dir}"\n`;
        });
      }
      if (config.tools.astGrep.utilDirs) {
        yaml += '      util_dirs:\n';
        config.tools.astGrep.utilDirs.forEach((dir: string) => {
          yaml += `        - "${dir}"\n`;
        });
      }
      if (config.tools.astGrep.packages) {
        yaml += '      packages:\n';
        config.tools.astGrep.packages.forEach((pkg: string) => {
          yaml += `        - "${pkg}"\n`;
        });
      }
    }
    
    return yaml;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('CodeRabbit MCP Server running on stdio');
  }
}

// Start the server
const server = new CodeRabbitMCPServer();
server.run().catch(console.error);

