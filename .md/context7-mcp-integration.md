# Context7 MCP Integration

Source: https://github.com/upstash/context7.git

## Overview

Context7 MCP is an up-to-date code documentation server that provides real-time, version-specific documentation and code examples directly to your LLM prompts. Instead of relying on outdated training data, Context7 fetches current documentation from library sources.

## Repository Location

The complete Context7 MCP repository has been integrated into this project at:
```
docs/context7/
```

## What Context7 Solves

### ❌ Without Context7
- Code examples are outdated and based on year-old training data
- Hallucinated APIs that don't even exist
- Generic answers for old package versions

### ✅ With Context7
- Up-to-date, version-specific documentation
- Real code examples from current library versions
- No tab-switching or manual documentation lookup

## Usage

Add `use context7` to your prompts:

```txt
Create a Next.js middleware that checks for a valid JWT in cookies and redirects unauthenticated users to `/login`. use context7
```

```txt
Configure a Cloudflare Worker script to cache JSON API responses for five minutes. use context7
```

## Installation Options

### Prerequisites
- Node.js >= v18.0.0
- Cursor, Claude Code, VS Code, Windsurf, or another MCP client
- Context7 API Key (optional for higher rate limits)

### Remote Server Connection (Recommended)

**Cursor:**
```json
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**Claude Code:**
```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_API_KEY"
```

**VS Code:**
```json
{
  "mcp": {
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
}
```

### Local Server Connection

**Cursor:**
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

**Claude Code:**
```bash
claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key YOUR_API_KEY
```

**VS Code:**
```json
{
  "mcp": {
    "servers": {
      "context7": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@upstash/context7-mcp", "--api-key", "YOUR_API_KEY"]
      }
    }
  }
}
```

### Build from Source

**Prerequisites:**
- Bun runtime
- TypeScript 5.8.2+

**Build Commands:**
```bash
cd docs/context7
bun install
bun run build
```

**Run Server:**
```bash
bun run dist/index.js --api-key YOUR_API_KEY
```

## Available Tools

Context7 MCP provides two main tools:

### 1. resolve-library-id
Resolves a general library name into a Context7-compatible library ID.
- **Parameters:**
  - `libraryName` (required): The name of the library to search for

### 2. get-library-docs
Fetches documentation for a library using a Context7-compatible library ID.
- **Parameters:**
  - `context7CompatibleLibraryID` (required): Exact Context7-compatible library ID (e.g., `/mongodb/docs`, `/vercel/next.js`)
  - `topic` (optional): Focus the docs on a specific topic (e.g., "routing", "hooks")
  - `tokens` (optional, default 5000): Max number of tokens to return (minimum 1000)

## Configuration Options

### Transport Methods
- **stdio** (default): Standard input/output transport
- **http**: HTTP transport with automatic SSE endpoint

### CLI Arguments
```bash
context7-mcp --transport <stdio|http> --port <number> --api-key <key>
```

### Environment Variables
- `CONTEXT7_API_KEY`: Your API key for authentication
- `https_proxy`/`HTTPS_PROXY`: Proxy configuration if needed

## Advanced Usage Tips

### 1. Auto-Rule Configuration
Create a rule in your MCP client to automatically use Context7:

```txt
Always use context7 when I need code generation, setup or configuration steps, or
library/API documentation. This means you should automatically use the Context7 MCP
tools to resolve library id and get library docs without me having to explicitly ask.
```

### 2. Direct Library ID Usage
If you know the exact library ID, skip the resolution step:

```txt
Implement basic authentication with Supabase. use library /supabase/supabase for API and docs.
```

### 3. Proxy Configuration
For environments behind HTTP proxies, Context7 respects standard proxy environment variables.

## Supported MCP Clients

Context7 supports extensive MCP client integration:

- **IDEs**: Cursor, VS Code, VS Code Insiders, Visual Studio 2022, JetBrains IDEs
- **AI Assistants**: Claude Code, Claude Desktop, Windsurf, Zed, Cline
- **Development Tools**: Gemini CLI, Amazon Q Developer, OpenAI Codex, LM Studio
- **Specialized Tools**: Augment Code, Roo Code, BoltAI, Crush, Warp, Kiro, Trae

## Security & Performance

### API Key Management
- Optional for basic usage (rate-limited)
- Required for higher rate limits
- Get your key at [context7.com/dashboard](https://context7.com/dashboard)
- Store in environment variables, never commit to code

### Rate Limiting
- Anonymous usage: Limited requests per hour
- Authenticated usage: Higher rate limits with API key
- Remote server recommended for production use

## Development & Building

### Local Development
```bash
cd docs/context7
bun install
bun run build
bun run dist/index.js --transport http --port 8080
```

### Testing with MCP Inspector
```bash
npx -y @modelcontextprotocol/inspector npx @upstash/context7-mcp
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN npm install -g @upstash/context7-mcp
CMD ["context7-mcp"]
```

## Troubleshooting

### Common Issues

**Module Not Found Errors:**
```json
{
  "mcpServers": {
    "context7": {
      "command": "bunx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**ESM Resolution Issues:**
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "--node-options=--experimental-vm-modules", "@upstash/context7-mcp"]
    }
  }
}
```

**TLS/Certificate Issues:**
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "--node-options=--experimental-fetch", "@upstash/context7-mcp"]
    }
  }
}
```

### General Solutions
1. Try adding `@latest` to the package name
2. Use `bunx` as an alternative to `npx`
3. Consider using `deno` as another runtime option
4. Ensure Node.js v18+ for native fetch support

## Integration with Marketing Campaign Generator

Context7 can enhance the marketing campaign generation process by:

1. **Framework Documentation**: Get up-to-date docs for React, Next.js, Vite
2. **API Integration**: Current documentation for Google Gemini AI, API clients
3. **Deployment Guides**: Latest deployment instructions for various platforms
4. **Library Usage**: Real-time examples for utility libraries and frameworks

## Community & Support

- **Website**: [context7.com](https://context7.com)
- **Discord**: [Upstash Community](https://upstash.com/discord)
- **Twitter/X**: [@context7ai](https://x.com/context7ai)
- **GitHub**: [Issues and Discussions](https://github.com/upstash/context7/issues)

## License

MIT License - See `docs/context7/LICENSE` for full details.