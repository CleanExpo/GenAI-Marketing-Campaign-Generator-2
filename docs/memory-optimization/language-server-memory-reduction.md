# Language Server Memory Reduction Guide

**Source**: https://interactive-data-language.github.io/vscode-idl/getting-started/faq/language_server_crashes.html

## Overview

This document provides guidance for preventing and resolving language server crashes due to memory issues, which can occur in development environments.

## Symptoms of Memory Issues

- Connection errors: "Connection to the language server got closed"
- Language server crashes or becomes unresponsive
- High memory usage in development tools
- IDE performance degradation

## Primary Causes

- **Memory Exhaustion**: The language server runs out of available memory
- **Large Repositories**: Projects with extensive codebases can overwhelm memory limits
- **Full Parsing**: Complete project analysis consuming excessive resources

## Recommended Solutions

### 1. Use Node.js for Language Server (Recommended)

**Benefits:**
- Automatic memory management improvements
- Better performance for large projects
- More efficient resource utilization

**Implementation:**
1. Install the latest Node.js v20 release from [official download page](https://nodejs.org/)
2. Ensure Node.js is available in system PATH
3. **Critical**: Completely close and restart VS Code
4. May require computer restart to update system path

**Verification:**
- The extension will automatically detect Node.js and use it for the language server
- Check VS Code output/logs to confirm Node.js is being used

### 2. Disable Full Parse Setting (Experimental)

**Setting**: `Language Server: Full Parse`

**Benefits when disabled:**
- Significant memory usage reduction
- Improved startup times for large repositories
- Less resource-intensive operation

**Trade-offs:**
- Won't provide complete diagnostics immediately
- Some advanced features may be limited initially
- Basic functionality (go-to-definition, etc.) remains functional

**How to configure:**
1. Open VS Code Settings
2. Search for "Language Server: Full Parse"
3. Disable the setting
4. Restart VS Code

## Best Practices for Memory Management

### Development Environment
- Close unnecessary VS Code windows/workspaces
- Limit the number of large files open simultaneously
- Consider using `.gitignore` patterns to exclude large generated files

### System Resources
- Ensure adequate RAM for development (8GB+ recommended)
- Monitor system memory usage during development
- Close memory-intensive applications when coding

### Project Structure
- Keep project dependencies minimal
- Regularly clean build artifacts and temporary files
- Use appropriate `.gitignore` files to exclude unnecessary files

## Troubleshooting Steps

1. **First Response**: Try the Node.js solution (most effective)
2. **If Node.js doesn't help**: Disable "Full Parse" setting
3. **System-level**: Restart VS Code completely
4. **Last resort**: Restart computer to refresh system resources

## When to Seek Additional Help

If memory errors persist after trying these solutions:
- Report the issue on the project's GitHub repository
- Include system specifications and error logs
- Describe which solutions were attempted

## Additional Considerations for Claude Code

- Be mindful of concurrent tool usage that may increase memory pressure
- Consider closing background bash processes when not needed
- Monitor resource usage during intensive operations
- Use memory-efficient approaches for file operations

## Implementation in This Project

For this GenAI Marketing Campaign Generator project:
- Ensure Node.js v20+ is installed for optimal performance
- Consider disabling full parse if working with large campaign datasets
- Monitor memory usage during AI model interactions
- Keep development server instances minimal (close unused ports)

---

**Note**: This guidance is applicable to VS Code language servers in general and can help prevent the types of crashes that might affect Claude Code operations.