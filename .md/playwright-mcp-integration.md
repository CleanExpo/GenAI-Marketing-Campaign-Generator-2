# Microsoft Playwright MCP Integration

Source: https://github.com/microsoft/playwright-mcp.git

## Overview

Microsoft Playwright MCP is a Model Context Protocol server that provides browser automation capabilities using Playwright. This server enables LLMs to interact with web pages through structured accessibility snapshots, bypassing the need for screenshots or vision models.

## Repository Location

The complete Microsoft Playwright MCP repository has been integrated into this project at:
```
docs/playwright-mcp/
```

## Key Features

- **Fast and Lightweight**: Uses Playwright's accessibility tree, not pixel-based input
- **LLM-Friendly**: No vision models needed, operates purely on structured data
- **Deterministic**: Avoids ambiguity common with screenshot-based approaches
- **Cross-Browser**: Supports Chrome, Firefox, Safari/WebKit, and Edge
- **Multiple Modes**: Persistent profile, isolated sessions, or browser extension

## What Playwright MCP Enables

### Browser Automation for Marketing
- **Landing Page Testing**: Automated testing of marketing campaign landing pages
- **Form Interactions**: Testing lead capture forms and user flows
- **Social Media Integration**: Automated interaction with social platforms
- **A/B Testing**: Automated comparison of different campaign variations
- **Analytics Verification**: Checking marketing analytics and tracking implementations

### Requirements
- Node.js 18 or newer
- VS Code, Cursor, Windsurf, Claude Desktop, or any MCP client
- Supported browsers: Chrome, Firefox, Safari, Edge

## Installation Options

### Standard NPX Installation (Recommended)

**Basic Configuration:**
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

### Client-Specific Installation

#### Cursor
```bash
# One-click install button available in README
# Or manual configuration in Cursor Settings → MCP → Add new MCP Server
```

#### Claude Code
```bash
claude mcp add playwright npx @playwright/mcp@latest
```

#### VS Code
```json
{
  "mcp": {
    "servers": {
      "playwright": {
        "type": "stdio",
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
}
```

#### Windsurf
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

## Configuration Options

### Command Line Arguments
Playwright MCP supports extensive configuration through CLI arguments:

#### Browser Configuration
- `--browser <browser>`: chrome, firefox, webkit, msedge
- `--device <device>`: Device to emulate (e.g., "iPhone 15")
- `--headless`: Run in headless mode
- `--executable-path <path>`: Custom browser executable path

#### Network & Security
- `--allowed-origins <origins>`: Semicolon-separated allowed origins
- `--blocked-origins <origins>`: Semicolon-separated blocked origins
- `--ignore-https-errors`: Ignore HTTPS certificate errors
- `--proxy-server <proxy>`: Proxy server configuration

#### Session Management
- `--isolated`: Keep browser profile in memory only
- `--user-data-dir <path>`: Custom user data directory
- `--storage-state <path>`: Initial storage state file
- `--save-session`: Save session to output directory

#### Capabilities
- `--caps <caps>`: Additional capabilities (vision, pdf, tabs)
- `--timeout-action <ms>`: Action timeout (default: 5000ms)
- `--timeout-navigation <ms>`: Navigation timeout (default: 60000ms)

### Configuration File

Create a JSON configuration file and use `--config path/to/config.json`:

```json
{
  "browser": {
    "browserName": "chromium",
    "isolated": false,
    "userDataDir": "./browser-profile",
    "launchOptions": {
      "headless": false,
      "channel": "chrome"
    },
    "contextOptions": {
      "viewport": { "width": 1920, "height": 1080 }
    }
  },
  "server": {
    "port": 8931,
    "host": "localhost"
  },
  "capabilities": ["tabs", "pdf", "vision"],
  "outputDir": "./playwright-output",
  "network": {
    "allowedOrigins": ["https://example.com"],
    "blockedOrigins": ["https://ads.example.com"]
  },
  "imageResponses": "allow"
}
```

## Browser Profile Management

### Persistent Profile (Default)
All logged-in information persists between sessions:

**Windows**: `%USERPROFILE%\AppData\Local\ms-playwright\mcp-{channel}-profile`
**macOS**: `~/Library/Caches/ms-playwright/mcp-{channel}-profile`
**Linux**: `~/.cache/ms-playwright/mcp-{channel}-profile`

### Isolated Mode
Each session starts fresh with optional initial state:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--isolated",
        "--storage-state=path/to/storage.json"
      ]
    }
  }
}
```

### Browser Extension
Connect to existing browser tabs using the Chrome extension:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--extension"]
    }
  }
}
```

## Available Tools

### Core Automation Tools

#### Navigation & Page Management
- `browser_navigate`: Navigate to URL
- `browser_navigate_back`: Go back to previous page
- `browser_close`: Close browser/page
- `browser_resize`: Resize browser window
- `browser_snapshot`: Capture accessibility snapshot
- `browser_take_screenshot`: Take page/element screenshot

#### Element Interactions
- `browser_click`: Click elements (single/double, with modifiers)
- `browser_type`: Type text into elements
- `browser_fill_form`: Fill multiple form fields at once
- `browser_select_option`: Select dropdown options
- `browser_hover`: Hover over elements
- `browser_drag`: Drag and drop between elements

#### Keyboard & Mouse
- `browser_press_key`: Press keyboard keys
- `browser_evaluate`: Execute JavaScript on page/elements
- `browser_handle_dialog`: Handle browser dialogs
- `browser_file_upload`: Upload files

#### Waiting & Timing
- `browser_wait_for`: Wait for text appearance/disappearance or time

### Advanced Capabilities (Opt-in)

#### Tab Management (`--caps=tabs`)
- `browser_tabs`: List, create, close, select browser tabs

#### PDF Generation (`--caps=pdf`)
- `browser_pdf_save`: Save page as PDF with custom filename

#### Coordinate-Based Actions (`--caps=vision`)
- `browser_mouse_click_xy`: Click at specific coordinates
- `browser_mouse_move_xy`: Move mouse to coordinates
- `browser_mouse_drag_xy`: Drag between coordinates

#### Tracing (`--caps=tracing`)
- `browser_start_tracing`: Start Playwright trace recording
- `browser_stop_tracing`: Stop trace recording

#### Browser Installation
- `browser_install`: Install browser if missing

### Information Gathering
- `browser_console_messages`: Get all console messages
- `browser_network_requests`: List network requests since page load

## Deployment Options

### Standalone HTTP Server
For environments without display or worker processes:

```bash
npx @playwright/mcp@latest --port 8931
```

```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8931/mcp"
    }
  }
}
```

### Docker Support
**Note**: Docker only supports headless Chromium.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "--init", "--pull=always", "mcr.microsoft.com/playwright/mcp"]
    }
  }
}
```

Long-running Docker service:
```bash
docker run -d -i --rm --init --pull=always \
  --entrypoint node \
  --name playwright \
  -p 8931:8931 \
  mcr.microsoft.com/playwright/mcp \
  cli.js --headless --browser chromium --no-sandbox --port 8931
```

### Programmatic Usage
```javascript
import { createConnection } from '@playwright/mcp';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

const connection = await createConnection({
  browser: { launchOptions: { headless: true } }
});
const transport = new SSEServerTransport('/messages', res);
await connection.connect(transport);
```

## Marketing Campaign Use Cases

### Landing Page Optimization
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--caps=pdf",
        "--save-session",
        "--device=iPhone 15"
      ]
    }
  }
}
```

### A/B Testing Automation
- Navigate to different campaign variants
- Capture screenshots and snapshots
- Fill out forms to test conversion flows
- Generate PDFs of different page versions

### Social Media Campaign Testing
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--caps=tabs,vision",
        "--allowed-origins=https://facebook.com;https://twitter.com;https://linkedin.com"
      ]
    }
  }
}
```

### Analytics and Tracking Verification
- Navigate to campaign pages
- Verify tracking pixels and analytics code
- Test form submissions and event tracking
- Validate marketing automation workflows

## Development and Testing

### Build from Source
```bash
cd docs/playwright-mcp
npm install
npm run test
```

### Testing Configuration
```bash
# Test specific browsers
npm run ctest  # Chrome
npm run ftest  # Firefox
npm run wtest  # WebKit
npm run dtest  # Docker
```

### Development Commands
- `npm run lint`: Update README with latest tool definitions
- `npm run docker-build`: Build Docker image
- `npm run copy-config`: Sync configuration types

## Security Considerations

### Origin Control
- Use `--allowed-origins` to limit accessible domains
- Use `--blocked-origins` to prevent access to sensitive sites
- Consider using isolated mode for untrusted operations

### File System Access
- `--output-dir` controls where files are saved
- Upload capabilities require explicit file paths
- User data directory can be customized or isolated

### Network Security
- Proxy support for corporate environments
- HTTPS error handling for development
- Service worker blocking available

## Integration with Marketing Campaign Generator

Playwright MCP enhances the marketing campaign generator by:

### Campaign Landing Page Testing
- Automated testing of generated campaign pages
- Form interaction testing for lead capture
- Mobile responsiveness verification across devices

### Multi-Platform Campaign Verification
- Test social media integrations across platforms
- Verify sharing functionality and metadata
- Screenshot generation for campaign documentation

### Analytics Implementation Testing
- Verify Google Analytics integration
- Test conversion tracking implementation
- Validate marketing automation triggers

### Competitive Analysis Automation
- Automated competitor page analysis
- Screenshot capture of competitor campaigns
- Form and user flow analysis

## Troubleshooting

### Common Issues
1. **Browser Not Found**: Use `browser_install` tool or specify `--executable-path`
2. **Permission Errors**: Check origin allowlists and user data directory permissions
3. **Timeout Issues**: Adjust `--timeout-action` and `--timeout-navigation` values
4. **Docker Issues**: Ensure Docker daemon is running and image is pulled

### Debug Options
- Use `--save-trace` to record detailed execution traces
- Enable `--save-session` to preserve browser state
- Check console messages with `browser_console_messages` tool
- Monitor network requests with `browser_network_requests`

## Performance Optimization

- Use headless mode for faster execution
- Configure appropriate timeouts for your use cases
- Use isolated mode to prevent state leakage between tests
- Consider browser extension mode for existing logged-in sessions

## License

Apache 2.0 License - See `docs/playwright-mcp/LICENSE` for full details.