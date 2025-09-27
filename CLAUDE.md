# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a React 18 + TypeScript + Vite application that generates comprehensive marketing campaigns using Google's Gemini AI with enterprise-grade Airtable CRM integration. The architecture follows a service-component pattern with centralized state management and abstract provider patterns for scalable integrations.

### Core Technologies
- **Frontend**: React 18.2.0, TypeScript 5.2.2, Vite 5.4.20
- **AI Integration**: Google Gemini AI (@google/genai 1.20.0) + SEMrush API (optional)
- **CRM Integration**: Airtable (v0.12.2) with abstract provider architecture
- **Enterprise Features**: Staff management, project tracking, campaign accountability
- **Styling**: Tailwind CSS (CDN-loaded)
- **Build**: Vite with hot reload and fast development
- **Deployment**: Vercel with automatic deployments from main branch

### Key Architecture Patterns

**Service Layer Pattern**: `services/geminiService.ts` handles all AI interactions with structured JSON schema validation. The service uses dual models - `gemini-2.5-flash` for text generation and `imagen-4.0-generate-001` for image generation. `services/semrushService.ts` provides SEO data integration for enhanced competitor analysis when API key is available.

**Centralized State Management**: `App.tsx` (405 lines) serves as the main state container, managing form data, settings, and results through React hooks. No external state management library is used.

**Component Composition**: Components follow atomic design with clear prop interfaces. Display components (`ResultsDisplay.tsx`, `AnalysisCard.tsx`) are presentational while `App.tsx` handles all business logic.

**Dynamic Schema Generation**: The AI service conditionally modifies response schemas based on user settings, enabling/disabling features like competitor analysis, trending topics, and Google E-E-A-T compliance.

## Development Commands

```bash
# Start development server (port 3000, or 3001+ if occupied)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Install dependencies
npm install
```

**Windows Development Issues**: On Windows systems, you may encounter Rollup dependency errors. These are typically resolved by a clean install:
```bash
# If you see "@rollup/rollup-win32-x64-msvc" missing error:
# DO NOT install the Windows-specific package as it breaks Vercel deployments
# Instead, do a clean install:
rm -rf node_modules package-lock.json
npm install
```

**Important**: The `@rollup/rollup-win32-x64-msvc` package is intentionally excluded as it causes Vercel deployment failures on Linux build environments.

**Development Server**: Vite automatically finds the next available port if 3000 is occupied. The server includes:
- Hot module replacement for React components
- Airtable API proxy (`/api/airtable` → `https://api.airtable.com/v0`)
- TypeScript compilation and error checking
- Development CORS handling

**Note**: No test runner, linting, or formatting scripts are configured. The project uses Vite's built-in TypeScript checking.

**Agent-Driven Development**: Use the Campaign Orchestrator agent for comprehensive testing and issue resolution. Deploy specialized agents in parallel for complex operations.

## Environment Setup

**Required Environment Variables**:
- `VITE_GEMINI_API_KEY` (Required): Google Gemini API key from Google AI Studio
- `VITE_AIRTABLE_API_KEY` (Optional): Airtable Personal Access Token for CRM integration
- `VITE_AIRTABLE_BASE_ID` (Optional): Airtable Base ID for enterprise features
- `VITE_SEMRUSH_API_KEY` (Optional): SEMrush API key for enhanced competitor analysis

**Development**: Create `.env.local` file with your API keys (see `.env.local.example`):
```bash
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
VITE_AIRTABLE_API_KEY=your_airtable_personal_access_token
VITE_AIRTABLE_BASE_ID=your_airtable_base_id
VITE_SEMRUSH_API_KEY=your_semrush_api_key_here
```

**⚠️ CRITICAL**: Placeholder values like `your_gemini_api_key_here` will cause API failures. Campaign generation requires valid Gemini API key.

**Deployment**: Configure environment variables in Vercel dashboard
**AI Studio Integration**: Pre-configured for deployment at https://ai.studio/apps/drive/1bq2wUh5pIiWkE-QyXRFbZdlPJZgw6Ee2

**IMPORTANT**: Never use `@variable_name` syntax in `vercel.json` - let Vercel auto-map dashboard variables.

## Data Flow Architecture

### Input Processing
1. User configures product description and advanced settings (16+ options)
2. Settings object constructed with branding context, social links, competitors
3. Form validation ensures required fields before submission
4. Data flows to `generateMarketingCampaign` service function

### AI Integration Flow
1. Dynamic prompt construction based on user settings
2. Conditional schema properties added/removed based on enabled features
3. Structured JSON response with runtime validation
4. Error handling with user-friendly fallbacks

### Results Display
1. Results rendered in organized sections (audience, messaging, content)
2. Interactive image generation with customizable prompts and styles
3. Platform-specific social media content with generated share links
4. SEO keywords, competitor analysis, and backlink strategies

## Component Structure

**App.tsx** - Main component containing:
- Product description form with inspiration prompts
- Advanced settings (creativity levels, writing styles, platform targeting)
- Branding context (company info, colors, logo upload with base64 encoding)
- Dynamic social media links and competitor management
- Strategic directives and content preferences

**ResultsDisplay.tsx** - Results rendering with:
- Interactive image generation system
- Social media examples with platform-specific formatting
- SEO metadata and keyword display
- Competitor analysis visualization

**services/geminiService.ts** - AI integration with:
- Dual model management (text + image generation)
- Schema-driven response validation
- Dynamic prompt construction
- Comprehensive error handling
- SEMrush data integration for enhanced competitor insights

**services/semrushService.ts** - SEO data integration with:
- Domain analysis (organic keywords, traffic, costs)
- Keyword research and ranking data
- Competitor discovery and analysis
- Graceful fallback when API key unavailable

**Enterprise Components**:
- **CampaignManager.tsx** - Campaign lifecycle management with Airtable sync
- **StaffManager.tsx** - Staff accountability and workload analytics
- **ProjectManager.tsx** - Project tracking and milestone management
- **CRMManager.tsx** - Multi-provider CRM integration interface
- **BrandKitManager.tsx** - Brand asset and guideline management
- **ExportManager.tsx** - Campaign export to PDF/other formats

**Core Services**:
- **airtableService.ts** - Enterprise-grade Airtable integration with staff management
- **authService.ts** - Authentication and user management
- **crmIntegration.ts** - Abstract CRM provider architecture
- **campaignStorage.ts** - Local campaign persistence and management
- **brandKitService.ts** - Brand asset processing and storage

## Advanced Features

**Interactive Image Generation**: Users can modify prompts, styles, aspect ratios, and generate new images on-demand with download capability.

**Platform-Specific Content**: Tailored examples for Facebook, Instagram, Twitter, LinkedIn, TikTok with appropriate hashtags and formatting.

**Google E-E-A-T Compliance**: Optional content optimization following Google's Expertise, Authoritativeness, Trustworthiness guidelines.

**Hemingway Writing Style**: Optional simplified writing approach for better readability.

**Competitor Analysis**: AI-powered website analysis with optional SEMrush integration for real SEO data (organic traffic, keyword rankings, competitor discovery). Visual indicator shows when SEMrush is active.

## Type Safety

All components use strict TypeScript with comprehensive interfaces:
- `CampaignResult` - Complete campaign data structure
- `AdvancedSettings` - User configuration options
- Component prop interfaces with proper null/undefined handling

**TypeScript Compilation Issues**: Currently has type definition errors that don't affect runtime:
```bash
# Check TypeScript compilation
npx tsc --noEmit
```
Known issues:
- Missing type definitions for Babel packages (`@babel/generator`, `@babel/template`, `@babel/traverse`)
- TSConfig project reference configuration issues
- Output file conflicts with source files

These don't affect the build process (`npm run build` succeeds) but should be resolved for clean development.

## File Upload Handling

Logo upload system converts images to base64 for AI processing. Images are previewed client-side and included in branding context for consistent visual identity across generated content.

## AI Integration Best Practices

When modifying AI features:
1. Update JSON schemas in `generateMarketingCampaign` function
2. Add conditional schema properties based on settings
3. Ensure response validation matches TypeScript interfaces
4. Handle API errors gracefully with user feedback
5. Test with various setting combinations to ensure schema consistency

## Agent-Driven Testing & Issue Resolution Protocol

**PRIMARY WORKFLOW**: Use Campaign Orchestrator as the main coordination agent for all comprehensive testing, issue resolution, and development tasks.

### Campaign Orchestrator Usage

**For Comprehensive Issue Resolution**:
```bash
# Use Campaign Orchestrator to coordinate full application testing
Task(campaign-orchestrator): "Perform comprehensive application audit including CRM integration, Staff table issues, and deployment verification"
```

**For Development Tasks**:
```bash
# Multi-agent coordination for complex features
Task(campaign-orchestrator): "Implement new feature with SEO optimization, content refinement, and deployment pipeline"
```

**For Parallel Problem Solving**:
```bash
# Deploy multiple specialized agents simultaneously
Task(campaign-orchestrator, semrush-api-connector, code-integrity-enforcer): "Resolve Staff table 403 errors, optimize SEO integration, and ensure code quality"
```

### Specialized Agent Protocols

**Technical Issues**: `code-integrity-enforcer` → TDD implementation, bug fixes, commit preparation
**SEO & Analytics**: `semrush-api-connector` + `seo-lighthouse-auditor` → Performance optimization
**Content Creation**: `content-refiner` + `google-creative-asset-generator` → Marketing asset generation
**Deployment**: `deployment-pipeline-engineer` → Vercel management, environment validation
**Data Persistence**: `airtable-data-logger` → CRM integration, campaign storage

### Current Priority Issues (Agent Assignment)

1. **Staff Table 403 Errors**: `campaign-orchestrator` + `airtable-data-logger` + `code-integrity-enforcer`
2. **CRM Integration Testing**: `campaign-orchestrator` + `airtable-data-logger`
3. **Deployment Verification**: `deployment-pipeline-engineer` + `seo-lighthouse-auditor`
4. **Performance Optimization**: `trend-algorithm-auditor` + `semrush-api-connector`

## Deployment Verification Protocol

**MANDATORY**: After every Vercel deployment, use Campaign Orchestrator to coordinate verification with deployment-pipeline-engineer and seo-lighthouse-auditor.

### Required Testing Steps

1. **Navigate to deployment URL**:
   ```javascript
   // Use current deployment URL - check Vercel dashboard for latest
   await page.goto('https://gen-ai-marketing-campaign-generator-[hash].vercel.app');
   ```

2. **Check console for errors**:
   ```javascript
   await browser_console_messages();
   ```

3. **Take deployment screenshot**:
   ```javascript
   await browser_take_screenshot({filename: "deployment-verification.png"});
   ```

4. **Verify environment variables loading**:
   - Check for "An API Key must be set" errors
   - Confirm no 404 errors for resources
   - Verify application renders (not white screen)

### Common Issues and Solutions

**White Screen + API Key Error**:
- Environment variables not configured in Vercel dashboard
- Incorrect variable names (must be `VITE_GEMINI_API_KEY` and `VITE_SEMRUSH_API_KEY`)
- Deployment authentication settings preventing public access

**Missing Resources (404s)**:
- Check `public/` directory contains all referenced files
- Verify favicon and assets are properly deployed

### Environment Variable Configuration

Ensure Vercel dashboard has:
- `VITE_GEMINI_API_KEY`: Google Gemini API key
- `VITE_SEMRUSH_API_KEY`: SEMrush API key (optional)

**Note**: Never use `@variable_name` syntax in `vercel.json` - let Vercel auto-map dashboard variables.

## SEMrush Integration

The application includes optional SEMrush API integration for enhanced competitor analysis:

**When Available**: Automatically fetches real SEO data (organic traffic, keywords, competitors) and integrates with AI analysis
**When Unavailable**: Gracefully falls back to AI-only competitor analysis
**UI Indicator**: Green "✓ SEMrush Enhanced" badge appears when API key is configured
**Rate Limiting**: Built-in error handling and API limits respect

## Recent Updates - Airtable CRM Integration

### Airtable CRM Integration Implementation (Latest)

**Complete integration architecture** implemented for Airtable CRM with full CRUD operations:

**Core Architecture**:
- `services/crmIntegration.ts` - Extended with comprehensive AirtableProvider class
- `components/CRMManager.tsx` - Updated with real connection testing
- Vite proxy configuration for CORS handling

**AirtableProvider Features**:
- Full CRUD operations for Contacts, Companies, Deals, Campaigns
- Field mapping between ZENITH and Airtable schemas
- Batch operations support (10 records per batch per Airtable limits)
- Comprehensive error handling with user-friendly messages
- Rate limiting awareness (5 req/sec per base)

**Connection Management**:
- Real-time connection testing via `CRMIntegrationService.testExistingConnection()`
- Automatic status updates (connected/error/disconnected)
- Secure credential storage in localStorage
- Visual connection status indicators in UI

**CORS Solution**:
- Vite development proxy: `/api/airtable` → `https://api.airtable.com/v0`
- Eliminates browser CORS restrictions during development
- Production-ready architecture for backend proxy implementation

**Documentation Created**:
- `docs/AirtableSetup.md` - Complete setup guide with table structures
- `docs/.md/AirtableAPIReference.md` - Comprehensive API reference from Context7 MCP

**Key Technical Fixes**:
1. Fixed mock connection testing → Real CRM service integration
2. Added proper error propagation and user feedback
3. Implemented Vite proxy for seamless API calls
4. Enhanced field mapping with custom field support
5. Added comprehensive validation and troubleshooting

**Table Structure Requirements**:
- Contacts: Email, First Name, Last Name, Company, Phone, ZENITH Contact ID
- Companies: Name, Domain, Industry, Size, ZENITH Company ID
- Deals: Name, Amount, Stage, Close Date, Contact, Company, ZENITH Deal ID
- Campaigns: Name, Type, Status, Start Date, End Date, Budget, ZENITH Campaign ID

**Authentication**: Uses Airtable Personal Access Tokens with base:read and base:write scopes.

**CRM Integration Service Methods**:
- `CRMIntegrationService.addConnection(config)` - Add new CRM connection
- `CRMIntegrationService.testExistingConnection(id)` - Test existing connection
- `CRMIntegrationService.testConnectionCredentials(config)` - Test credentials before saving
- `CRMIntegrationService.syncCampaign(campaign)` - Sync campaign to CRM
- `CRMIntegrationService.getConnections()` - Get all connections
- `CRMIntegrationService.deleteConnection(id)` - Remove connection

## Agent Integration Architecture (Latest)

**Specialized Agent System**: The application now uses Campaign Orchestrator as the main coordination agent with 9 specialized agents for comprehensive testing, development, and issue resolution:

**Primary Coordination Agent**:
- **campaign-orchestrator**: Main orchestrator for multi-platform marketing campaign generation, coordinating research, content creation, and deployment workflows

**Specialized Agents**:
- **semrush-api-connector**: SEO data fetching, keyword research, and competitive analysis
- **trend-algorithm-auditor**: Real-time competitive analysis and algorithm compliance auditing
- **content-refiner**: Marketing copy refinement using Hemingway Style principles
- **seo-lighthouse-auditor**: Technical SEO audits and Lighthouse-style scoring
- **google-creative-asset-generator**: Visual content creation using Google's Imagen and Veo models
- **code-integrity-enforcer**: Code quality assurance, TDD implementation, and commit preparation
- **deployment-pipeline-engineer**: Vercel deployment management and environment validation
- **airtable-data-logger**: Campaign data persistence and CRM integration logging

**Agent Workflow Pattern**:
1. **Campaign Orchestrator** coordinates the complete workflow
2. **Parallel-R1 Execution**: Multiple agents work simultaneously for optimal performance
3. **MCP Integration**: Agents leverage Model Context Protocol for enhanced functionality
4. **Issue Resolution**: Specialized agents handle specific technical domains

**Usage Protocol**:
- Use Campaign Orchestrator for comprehensive campaign generation and testing
- Deploy agents in parallel for complex multi-step operations
- Leverage specialized agents for domain-specific issues (SEO, deployment, code quality)
- All agents integrate with existing Airtable CRM and Vercel deployment infrastructure

**Quick Agent Commands**:
```bash
# Comprehensive application audit
Task(campaign-orchestrator): "Perform full application testing and issue resolution"

# Parallel development workflow
Task(campaign-orchestrator, code-integrity-enforcer, deployment-pipeline-engineer): "Implement feature with testing and deployment"

# CRM integration troubleshooting
Task(airtable-data-logger, campaign-orchestrator): "Resolve Airtable Staff table 403 errors"
```

## CRM Integration Architecture

**Abstract Provider Pattern**: `services/crmIntegration.ts` implements a CRM provider abstraction layer enabling multiple CRM integrations through a unified interface.

**Provider Hierarchy**:
```typescript
abstract class CRMProvider {
  // Authentication & testing
  abstract testConnection(): Promise<boolean>

  // CRUD operations for each entity type
  abstract createContact/Company/Deal/Campaign()
  abstract updateContact/Company/Deal/Campaign()
  abstract getContact/Company/Deal/Campaign()

  // Batch operations and field mapping
  abstract batchSync(): Promise<CRMSyncResult>
  abstract getCustomFields(): Promise<Record<string, any>>
}
```

**Implemented Providers**:
- **AirtableProvider**: Full implementation with Airtable REST API integration
- **SalesforceProvider**: OAuth-ready skeleton (requires OAuth setup)
- **HubSpotProvider**: Placeholder for future implementation

**Connection Management**: `CRMIntegrationService` acts as the main orchestrator:
- localStorage-based connection persistence
- Real-time status monitoring (connected/error/disconnected)
- Provider factory pattern with runtime provider instantiation
- Connection testing with automatic status updates

**Field Mapping Strategy**: Each provider maps between ZENITH campaign data and CRM-specific field structures:
- Contacts: Email, Name, Company → CRM contact fields
- Campaigns: ZENITH campaign → CRM campaign with custom fields for metadata
- Companies/Deals: Future expansion for full CRM workflow

**Airtable Integration Specifics**:
- Uses Personal Access Tokens (base:read, base:write scopes)
- Batch operations limited to 10 records per request (Airtable limit)
- Rate limiting: 5 requests per second per base
- Proxy configuration handles CORS in development via Vite proxy

## Common Development Issues

### API Key Problems
- **"API key not valid"**: Replace placeholder values in `.env.local` with real API keys
- **Campaign generation fails**: Ensure `VITE_GEMINI_API_KEY` has valid Google Gemini API key
- **Airtable connection errors**: Expected when using placeholder `VITE_AIRTABLE_API_KEY` values

### Development Server Issues
- **"Cannot find module @rollup/rollup-win32-x64-msvc"**: Run `npm install @rollup/rollup-win32-x64-msvc --save-dev`
- **White page on localhost**: Check browser console for errors, verify dev server is running
- **Port conflicts**: Vite auto-increments port (3000 → 3001 → 3002, etc.)

### Build and TypeScript Issues
- **TypeScript errors**: Known issues with Babel type definitions (don't affect runtime)
- **Large bundle warning**: 643kB main chunk size warning (optimization needed)
- **Build succeeds with warnings**: This is expected behavior

### CRM Integration Issues
- **Airtable 404 errors**: Expected when using placeholder credentials
- **CRM connection failed**: Verify Airtable base ID and API key are correct
- **CORS errors**: Ensure Vite proxy is working (`/api/airtable` routes)