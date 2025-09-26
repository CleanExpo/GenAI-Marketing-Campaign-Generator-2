# MCP Installation Guide for Windows/VS Code/Node.js Environment

## Environment Overview
- **OS**: Windows 11/10
- **IDE**: Visual Studio Code
- **Runtime**: Node.js
- **CLI**: Claude Code CLI

## Prerequisites Checklist

### Required Software
- [ ] Windows 10/11 (64-bit)
- [ ] Visual Studio Code (version 1.101+ for remote MCP support)
- [ ] Node.js (version 18+ recommended)
- [ ] npm or yarn package manager
- [ ] Git for Windows
- [ ] Docker (optional, for local GitHub MCP server)
- [ ] Go 1.23.7+ (optional, for building from source)
- [ ] Claude Code CLI installed and configured

### Required Accounts
- [ ] GitHub account with appropriate permissions
- [ ] GitHub Copilot subscription (if using GitHub MCP)
- [ ] Claude API access

## Step-by-Step Installation Process

### 1. Environment Preparation

#### Update Node.js and npm
```powershell
# Check current versions
node --version
npm --version

# Update npm to latest
npm install -g npm@latest
```

#### Verify VS Code Extensions
```powershell
# List installed VS Code extensions
code --list-extensions

# Install required extensions if missing
code --install-extension GitHub.copilot
code --install-extension ms-vscode.vscode-typescript-next
```

### 2. GitHub MCP Server Options

**IMPORTANT**: This project now includes the official GitHub MCP server at `docs/github-mcp-server/`. You have three installation options:

#### Option A: Remote GitHub MCP Server (Recommended)
- Hosted by GitHub
- Easiest to set up
- Requires VS Code 1.101+
- Supports OAuth and PAT authentication

#### Option B: Local Docker-based Server
- Uses official Docker image
- Full control over server environment
- Requires Docker installation
- Best for development and testing

#### Option C: Build from Source
- Complete control and customization
- Requires Go 1.23.7+
- Source available at `docs/github-mcp-server/`
- Best for advanced users

### 3. MCP Server Configuration

#### Create MCP Configuration Directory
```powershell
# Create MCP config directory in user profile
mkdir $env:USERPROFILE\.config\mcp
cd $env:USERPROFILE\.config\mcp
```

#### Configuration File Template
Create `mcp-config.json`:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

### 3. VS Code Configuration

#### Update VS Code Settings
Add to `settings.json`:
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
  },
  "claude.mcpEnabled": true,
  "claude.mcpConfigPath": "%USERPROFILE%\\.config\\mcp\\mcp-config.json"
}
```

### 4. Environment Variables Setup

#### Set System Environment Variables
```powershell
# Set GitHub token (replace with your actual token)
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_your_token_here", "User")

# Verify environment variable
$env:GITHUB_TOKEN
```

#### Create .env file in project root
```bash
# GitHub Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your_username
GITHUB_REPO=your_repo_name

# MCP Configuration
MCP_SERVER_PORT=3000
MCP_LOG_LEVEL=info
```

### 5. Install MCP Packages

#### Install GitHub MCP Server
```powershell
# Install globally for system-wide access
npm install -g @modelcontextprotocol/server-github

# Or install locally in project
npm install --save-dev @modelcontextprotocol/server-github
```

#### Install Additional MCP Servers (Optional)
```powershell
# File system MCP server
npm install -g @modelcontextprotocol/server-filesystem

# Web search MCP server
npm install -g @modelcontextprotocol/server-web-search
```

### 6. Claude Code CLI Integration

#### Create Claude Code Configuration
Create `.claude-code.json` in project root:
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
  },
  "project": {
    "name": "GenAI Marketing Campaign Generator",
    "type": "react-typescript",
    "framework": "vite"
  }
}
```

### 7. Verification Steps

#### Test MCP Server Connection
```powershell
# Test GitHub MCP server manually
npx @modelcontextprotocol/server-github --help

# Test with Claude Code CLI
claude-code --test-mcp github
```

#### Verify VS Code Integration
1. Open VS Code
2. Open Command Palette (Ctrl+Shift+P)
3. Search for "Claude: Test MCP Connection"
4. Verify successful connection

### 8. Troubleshooting Common Issues

#### Issue: MCP Server Not Found
```powershell
# Solution: Reinstall MCP server
npm uninstall -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-github

# Clear npm cache
npm cache clean --force
```

#### Issue: Authentication Failed
- Verify GitHub token permissions
- Check environment variable is set correctly
- Regenerate GitHub token if needed

#### Issue: VS Code Extension Not Loading
- Restart VS Code completely
- Check VS Code logs: Help → Toggle Developer Tools → Console
- Reinstall Claude Code extension

#### Issue: Port Conflicts
```powershell
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <process_id> /F
```

### 9. Security Best Practices

#### Token Management
- Store tokens in environment variables, never in code
- Use tokens with minimal required scopes
- Rotate tokens regularly
- Never commit tokens to version control

#### Add to .gitignore
```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# MCP configuration with tokens
mcp-config.json
.claude-code.json

# Logs
*.log
mcp-server.log
```

### 10. Testing Your Setup

#### Create Test Script
Create `test-mcp.js`:
```javascript
const { exec } = require('child_process');

// Test MCP server availability
exec('npx @modelcontextprotocol/server-github --version', (error, stdout, stderr) => {
  if (error) {
    console.error('MCP Server test failed:', error);
    return;
  }
  console.log('MCP Server available:', stdout);
});

// Test environment variables
if (process.env.GITHUB_TOKEN) {
  console.log('✅ GitHub token configured');
} else {
  console.log('❌ GitHub token missing');
}
```

Run test:
```powershell
node test-mcp.js
```

## Post-Installation Checklist

- [ ] MCP servers installed and accessible
- [ ] VS Code configured with proper settings
- [ ] Environment variables set correctly
- [ ] GitHub authentication working
- [ ] Claude Code CLI recognizes MCP servers
- [ ] Test connections successful
- [ ] Security measures in place (.gitignore, token management)

## Maintenance Tasks

### Weekly
- [ ] Check for MCP server updates: `npm outdated -g`
- [ ] Verify token expiration dates
- [ ] Review MCP server logs for errors

### Monthly
- [ ] Update MCP servers: `npm update -g`
- [ ] Rotate authentication tokens
- [ ] Clean npm cache: `npm cache clean --force`

## Getting Help

If you encounter issues:
1. Check this documentation first
2. Review MCP server logs
3. Check VS Code Developer Console
4. Verify environment variables
5. Test with minimal configuration
6. Search GitHub issues for known problems

## Additional Resources

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [GitHub MCP Server GitHub Repo](https://github.com/modelcontextprotocol/servers)
- [Claude Code Documentation](https://docs.claude.ai/claude-code)
- [VS Code Extension API](https://code.visualstudio.com/api)