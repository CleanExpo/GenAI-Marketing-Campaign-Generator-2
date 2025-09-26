# Official GitHub MCP Server Documentation

Source: https://github.com/github/github-mcp-server

## Overview

The official GitHub MCP Server connects AI tools directly to GitHub's platform, providing AI agents, assistants, and chatbots the ability to read repositories, manage issues and PRs, analyze code, and automate workflows through natural language interactions.

## Repository Location

The complete GitHub MCP server repository has been integrated into this project at:
```
docs/github-mcp-server/
```

## Installation Options

### Remote GitHub MCP Server (Recommended)

The remote server is hosted by GitHub and provides the easiest installation method.

**Prerequisites:**
- VS Code 1.101+ or compatible MCP host
- GitHub account with appropriate permissions

**VS Code Configuration (OAuth):**
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

**VS Code Configuration (PAT):**
```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${input:github_mcp_pat}"
      }
    }
  },
  "inputs": [
    {
      "type": "promptString",
      "id": "github_mcp_pat",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ]
}
```

### Local GitHub MCP Server (Docker)

**Prerequisites:**
- Docker installed and running
- GitHub Personal Access Token

**VS Code Configuration:**
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
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      }
    }
  }
}
```

### Build from Source (Go)

**Prerequisites:**
- Go 1.23.7+ installed
- GitHub Personal Access Token

**Build Commands:**
```bash
cd docs/github-mcp-server
go build -o github-mcp-server cmd/github-mcp-server/main.go
```

**Configuration:**
```json
{
  "servers": {
    "github": {
      "command": "/path/to/github-mcp-server",
      "args": ["stdio"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<YOUR_TOKEN>"
      }
    }
  }
}
```

## Tool Configuration

### Available Toolsets

The server supports enabling/disabling specific functionality groups:

| Toolset | Description |
|---------|-------------|
| `context` | **Strongly recommended**: Current user and GitHub context |
| `actions` | GitHub Actions workflows and CI/CD operations |
| `code_security` | Code scanning and security tools |
| `dependabot` | Dependabot alerts and management |
| `discussions` | GitHub Discussions |
| `experiments` | Experimental features (unstable) |
| `gists` | GitHub Gist operations |
| `issues` | Issue management |
| `notifications` | Notification management |
| `orgs` | Organization tools |
| `projects` | GitHub Projects |
| `pull_requests` | Pull request operations |
| `repos` | Repository management |
| `secret_protection` | Secret scanning |
| `security_advisories` | Security advisory management |
| `users` | User operations |

### Specifying Toolsets

**Command Line:**
```bash
github-mcp-server --toolsets repos,issues,pull_requests,actions
```

**Environment Variable:**
```bash
GITHUB_TOOLSETS="repos,issues,pull_requests,actions" github-mcp-server
```

**Docker:**
```bash
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_TOOLSETS="repos,issues,pull_requests" \
  ghcr.io/github/github-mcp-server
```

## Advanced Features

### Dynamic Tool Discovery
Enable dynamic toolset discovery to reduce tool confusion:

```bash
# Binary
github-mcp-server --dynamic-toolsets

# Docker
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_DYNAMIC_TOOLSETS=1 \
  ghcr.io/github/github-mcp-server
```

### Read-Only Mode
Restrict to read-only operations:

```bash
# Binary
github-mcp-server --read-only

# Docker
docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN=<token> \
  -e GITHUB_READ_ONLY=1 \
  ghcr.io/github/github-mcp-server
```

### GitHub Enterprise Support
Configure for GitHub Enterprise Server or Enterprise Cloud:

```json
{
  "servers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "-e", "GITHUB_HOST", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}",
        "GITHUB_HOST": "https://your-enterprise-domain.com"
      }
    }
  }
}
```

## Key Capabilities

### Repository Management
- Browse and query code
- Search files and analyze commits
- Create/update/delete files
- Manage branches and tags
- Fork repositories

### Issue & PR Operations
- Create, update, and manage issues
- Handle pull requests and reviews
- Add comments and manage assignments
- Triage and organize work

### CI/CD Integration
- Monitor GitHub Actions workflows
- Analyze build failures
- Manage releases
- Access workflow logs and artifacts

### Code Security
- Review security findings
- Manage Dependabot alerts
- Handle secret scanning results
- Access security advisories

### Team Collaboration
- Manage notifications
- Access discussions
- Analyze team activity
- Handle organization operations

## Security Best Practices

### Token Management
- Use OAuth when possible for better security
- Store PATs in environment variables only
- Use minimal required token scopes:
  - `repo` - Repository operations
  - `read:packages` - Docker image access
  - `read:org` - Organization access
- Rotate tokens regularly
- Never commit tokens to version control

### Configuration Security
- Protect configuration files: `chmod 600 config.json`
- Use input prompts for tokens in VS Code
- Separate tokens for different environments
- Monitor token usage and access logs

## Troubleshooting

### Common Issues
1. **Docker pull errors**: `docker logout ghcr.io` if you have expired tokens
2. **Authentication failed**: Verify token permissions and scopes
3. **VS Code not loading**: Check VS Code version (1.101+ required)
4. **Port conflicts**: Use `--read-only` or different port configurations

### Debug Steps
1. Check token permissions in GitHub settings
2. Verify environment variables are set correctly
3. Test with minimal toolset configuration
4. Review server logs for detailed error information
5. Ensure network connectivity to GitHub API

## Integration with Your Project

The GitHub MCP server is now available at `docs/github-mcp-server/` and can be:
1. Built from source for local development
2. Used via Docker for production deployments
3. Configured with remote server for easiest setup

Reference the complete documentation in `docs/github-mcp-server/README.md` for detailed usage instructions and all available tools.