# GitHub MCP Server Documentation

Source: https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp/use-the-github-mcp-server

## Overview

The GitHub Model Context Protocol (MCP) server allows developers to interact with GitHub features directly through Copilot Chat across multiple development environments.

## Prerequisites

- GitHub account
- Compatible IDE (Visual Studio Code, Visual Studio, JetBrains IDEs, Xcode, Eclipse)
- Copilot access

## Authentication Methods

### 1. OAuth (Recommended)
- Provides scoped access based on user approval
- More secure and user-friendly

### 2. Personal Access Token (PAT)
- Requires manually configured token with appropriate scopes
- Useful for automation and enterprise environments

## Configuration Options

### Remote Server Configuration
```json
{
  "servers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "type": "http"
    }
  }
}
```

### Local Server Setup
- Requires Docker
- More control over the server environment
- Better for development and testing

## Supported Actions

- Create branches
- Merge pull requests
- Search repositories
- List issues
- Retrieve repository information
- File operations
- Repository management

## Usage Example

1. Open Copilot Chat
2. Select "Agent" mode
3. Click tools icon to see available actions
4. Type command (e.g., "Create a new branch")
5. Confirm action when prompted

## Authentication Considerations

- OAuth provides scoped access based on user approval
- PAT requires manually configured token with appropriate scopes
- Enterprise environments may have additional restrictions
- Tokens should be stored securely and rotated regularly

## Troubleshooting Tips

- Verify GitHub sign-in
- Check PAT scopes if using Personal Access Token
- Restart IDE/MCP server
- Review server logs for detailed error information
- Ensure network connectivity to GitHub API
- Check rate limiting status

## Limitations

- Some actions may require manual intervention
- Specific skills vary by environment
- Rate limiting applies to API calls
- Enterprise policies may restrict certain operations

## Security Best Practices

- Use OAuth when possible
- Limit PAT scopes to minimum required
- Store tokens securely
- Regularly rotate authentication credentials
- Monitor access logs
- Follow principle of least privilege

## Environment-Specific Notes

### Windows
- Ensure proper PATH configuration
- Use PowerShell or Command Prompt for setup
- Consider WSL for Linux-like environment

### VS Code
- Install required extensions
- Configure settings.json properly
- Restart VS Code after configuration changes

### Node.js
- Ensure compatible Node.js version
- Install required npm packages
- Use npm or yarn for dependency management

The GitHub MCP server provides a flexible, context-aware AI assistance platform across development workflows.