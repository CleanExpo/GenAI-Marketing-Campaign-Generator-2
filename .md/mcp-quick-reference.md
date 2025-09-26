# MCP Quick Reference Guide

## Essential Commands

### Installation

#### Official GitHub MCP Server (Recommended)
```powershell
# Remote server (VS Code 1.101+) - No installation needed
# Add to VS Code MCP settings

# Docker-based local server
docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> ghcr.io/github/github-mcp-server

# Build from source (Go)
cd docs/github-mcp-server
go build -o github-mcp-server cmd/github-mcp-server/main.go
```

#### Microsoft Playwright MCP Server (Browser Automation)
```powershell
# NPX installation (recommended)
npx @playwright/mcp@latest

# With capabilities (tabs, PDF, vision)
npx @playwright/mcp@latest --caps=tabs,pdf,vision

# Docker (headless Chrome only)
docker run -i --rm --init --pull=always mcr.microsoft.com/playwright/mcp

# HTTP server mode
npx @playwright/mcp@latest --port 8931
```

#### Context7 MCP Server (Documentation)
```powershell
# Remote server (recommended) - No installation needed
# Add to MCP settings: https://mcp.context7.com/mcp

# Local server via NPX
npx -y @upstash/context7-mcp --api-key YOUR_API_KEY

# Build from source
cd docs/context7
bun install && bun run build
bun run dist/index.js --api-key YOUR_API_KEY
```

#### Community MCP Servers
```powershell
# Install GitHub MCP Server (community)
npm install -g @modelcontextprotocol/server-github

# Install File System MCP Server
npm install -g @modelcontextprotocol/server-filesystem

# Install Web Search MCP Server
npm install -g @modelcontextprotocol/server-web-search
```

### Testing
```powershell
# Test official GitHub MCP server
docker run --rm ghcr.io/github/github-mcp-server --version

# Test Playwright MCP server
npx @playwright/mcp@latest --help

# Test Context7 MCP server
npx -y @upstash/context7-mcp --help

# Test community MCP server
npx @modelcontextprotocol/server-github --version

# Test environment variables
echo $env:GITHUB_TOKEN
echo $env:CONTEXT7_API_KEY

# Test with Claude Code
claude-code --test-mcp github
claude-code --test-mcp playwright
claude-code --test-mcp context7
```

### Common Issues & Quick Fixes

#### Token Issues
```powershell
# Set GitHub token
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token", "User")

# Refresh environment
refreshenv
```

#### Package Issues
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall MCP server
npm uninstall -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-github
```

#### VS Code Issues
- Restart VS Code completely
- Check Developer Console (Help → Toggle Developer Tools)
- Reload Window (Ctrl+Shift+P → "Developer: Reload Window")

## Configuration Templates

### Official GitHub MCP Server (Remote - Recommended)
```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

### Official GitHub MCP Server (Docker)
```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "github_token",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ],
  "servers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    }
  }
}
```

### Context7 MCP Server (Remote - Recommended)
```json
{
  "servers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### Playwright MCP Server (Standard)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

### Playwright MCP Server (With Capabilities)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--caps=tabs,pdf,vision",
        "--browser=chrome",
        "--device=iPhone 15"
      ]
    }
  }
}
```

### Playwright MCP Server (HTTP Mode)
```json
{
  "servers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

### Context7 MCP Server (Local)
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

### Community MCP Server
```json
{
  "mcp.servers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

### .claude-code.json
```json
{
  "mcp": {
    "enabled": true,
    "servers": [
      {
        "name": "github",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "env": {
          "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
        }
      }
    ]
  }
}
```

## Security Checklist

- [ ] Tokens stored in environment variables only
- [ ] .env files in .gitignore
- [ ] Minimal token scopes used
- [ ] Regular token rotation scheduled
- [ ] No tokens in code/config files committed

## Troubleshooting Steps

1. **Check Prerequisites**
   - Node.js version 18+
   - npm updated to latest
   - VS Code with required extensions

2. **Verify Installation**
   - MCP servers globally accessible
   - Environment variables set
   - VS Code configuration correct

3. **Test Connection**
   - Run test scripts
   - Check server logs
   - Verify API authentication

4. **Common Solutions**
   - Restart VS Code
   - Clear npm cache
   - Regenerate tokens
   - Check network connectivity

## Support Resources

- Full installation guide: `.md/mcp-installation-guide-windows.md`
- GitHub MCP docs: `.md/github-mcp-server.md`
- MCP Protocol: https://spec.modelcontextprotocol.io/
- Claude Code docs: https://docs.claude.ai/claude-code