# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a React 19 + TypeScript + Vite application that generates comprehensive marketing campaigns using Google's Gemini AI. The architecture follows a service-component pattern with centralized state management in the main App component.

### Core Technologies
- **Frontend**: React 19.1.1, TypeScript 5.8.2, Vite 6.2.0
- **AI Integration**: Google Gemini AI (@google/genai 1.20.0)
- **Styling**: Tailwind CSS (CDN-loaded)
- **Build**: Vite with hot reload and fast development

### Key Architecture Patterns

**Service Layer Pattern**: `services/geminiService.ts` handles all AI interactions with structured JSON schema validation. The service uses dual models - `gemini-2.5-flash` for text generation and `imagen-4.0-generate-001` for image generation.

**Centralized State Management**: `App.tsx` (405 lines) serves as the main state container, managing form data, settings, and results through React hooks. No external state management library is used.

**Component Composition**: Components follow atomic design with clear prop interfaces. Display components (`ResultsDisplay.tsx`, `AnalysisCard.tsx`) are presentational while `App.tsx` handles all business logic.

**Dynamic Schema Generation**: The AI service conditionally modifies response schemas based on user settings, enabling/disabling features like competitor analysis, trending topics, and Google E-E-A-T compliance.

## Development Commands

```bash
# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Install dependencies
npm install
```

**Note**: No test runner, linting, or formatting scripts are configured in package.json. The project uses Vite's built-in TypeScript checking and hot reload for development.

## Environment Setup

**Required Environment Variable**: `VITE_GEMINI_API_KEY` - Get from Google AI Studio
**Development**: Create `.env.local` file with your API key
**Deployment**: Configure environment variable in your hosting platform
**AI Studio Integration**: Pre-configured for deployment at https://ai.studio/apps/drive/1bq2wUh5pIiWkE-QyXRFbZdlPJZgw6Ee2

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

## Advanced Features

**Interactive Image Generation**: Users can modify prompts, styles, aspect ratios, and generate new images on-demand with download capability.

**Platform-Specific Content**: Tailored examples for Facebook, Instagram, Twitter, LinkedIn, TikTok with appropriate hashtags and formatting.

**Google E-E-A-T Compliance**: Optional content optimization following Google's Expertise, Authoritativeness, Trustworthiness guidelines.

**Hemingway Writing Style**: Optional simplified writing approach for better readability.

**Competitor Analysis**: Website analysis integration with strategic recommendations.

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