# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a React 19 + TypeScript + Vite application that generates comprehensive marketing campaigns using Google's Gemini AI. The architecture follows a service-component pattern with centralized state management in the main App component.

### Core Technologies
- **Frontend**: React 19.1.1, TypeScript 5.8.2, Vite 6.2.0
- **AI Integration**: Google Gemini AI (@google/genai 1.20.0) + SEMrush API (optional)
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

**Windows Development Issues**: On Windows systems, you may encounter Rollup dependency errors. Fix with:
```bash
# If you see "@rollup/rollup-win32-x64-msvc" missing error:
npm install @rollup/rollup-win32-x64-msvc

# If persistent issues, clean install:
rm -rf node_modules package-lock.json
npm install
```

**Development Server**: Vite automatically finds the next available port if 3000 is occupied. The server includes:
- Hot module replacement for React components
- Airtable API proxy (`/api/airtable` → `https://api.airtable.com/v0`)
- TypeScript compilation and error checking
- Development CORS handling

**Note**: No test runner, linting, or formatting scripts are configured. The project uses Vite's built-in TypeScript checking.

## Environment Setup

**Required Environment Variables**:
- `VITE_GEMINI_API_KEY` (Required): Google Gemini API key from Google AI Studio
- `VITE_SEMRUSH_API_KEY` (Optional): SEMrush API key for enhanced competitor analysis

**Development**: Create `.env.local` file with your API keys (see `.env.example`)
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

## File Upload Handling

Logo upload system converts images to base64 for AI processing. Images are previewed client-side and included in branding context for consistent visual identity across generated content.

## AI Integration Best Practices

When modifying AI features:
1. Update JSON schemas in `generateMarketingCampaign` function
2. Add conditional schema properties based on settings
3. Ensure response validation matches TypeScript interfaces
4. Handle API errors gracefully with user feedback
5. Test with various setting combinations to ensure schema consistency

## Deployment Verification Protocol

**MANDATORY**: After every Vercel deployment, use Playwright MCP to verify the application is working correctly.

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