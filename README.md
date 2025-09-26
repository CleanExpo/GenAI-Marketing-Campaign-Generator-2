<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI Marketing Campaign Generator

A comprehensive React application that generates marketing campaigns using Google's Gemini AI. Create audience targeting, social media content, SEO strategies, and visual assets all in one platform.

View your app in AI Studio: https://ai.studio/apps/drive/1bq2wUh5pIiWkE-QyXRFbZdlPJZgw6Ee2

## Features

- 🎯 **Smart Audience Targeting** - AI-powered demographic and psychographic analysis
- 📱 **Multi-Platform Content** - Tailored content for Facebook, Instagram, Twitter, LinkedIn, TikTok
- 🖼️ **AI Image Generation** - Custom visuals using Imagen 4.0 with style customization
- 📈 **SEO Optimization** - Keyword research and Google E-E-A-T compliance
- 🔍 **Competitor Analysis** - Strategic insights from competitor websites with optional SEMrush SEO data integration
- 📊 **Trending Topics Integration** - Leverage current trends in your campaigns
- 🎨 **Brand Consistency** - Upload logos and set brand colors for cohesive messaging

## Prerequisites

- Node.js (v18 or higher)
- Gemini API key from [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
- SEMrush API key from [SEMrush API](https://www.semrush.com/api/) (optional, for enhanced competitor analysis)

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GenAI-Marketing-Campaign-Generator-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Build

```bash
npm run build
npm run preview  # Preview the production build locally
```

## Deployment

### Vercel Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Set environment variables in Vercel dashboard:**
   - Variable Name: `VITE_GEMINI_API_KEY`
   - Value: Your Gemini API key

3. **Deployment Configuration**
   The included `vercel.json` configures:
   - Build settings for Vite
   - Environment variable handling
   - SPA routing support

### Manual Deployment Steps

If your deployment is showing authentication issues:

1. **Check Vercel project settings**
   - Ensure the project is set to public, not private
   - Verify environment variables are correctly set
   - Confirm build command is `npm run build`
   - Verify output directory is `dist`

2. **Redeploy with correct settings**
   ```bash
   vercel --prod --env VITE_GEMINI_API_KEY=your_key_here
   ```

## Project Structure

```
├── components/          # React components
├── services/           # API integration (Gemini AI)
├── types.ts           # TypeScript interfaces
├── constants.tsx      # App constants and configurations
├── vite.config.ts     # Vite configuration
├── vercel.json        # Vercel deployment settings
└── CLAUDE.md          # Development documentation
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `VITE_SEMRUSH_API_KEY` | SEMrush API key for enhanced competitor analysis | ⚠️ Optional* |

*When SEMrush API key is provided, competitor analysis will include real SEO data including organic traffic, keyword rankings, and competitor insights.

## Troubleshooting

### Build Issues
- Clear `node_modules` and `package-lock.json` if encountering dependency conflicts
- Ensure Node.js version is 18 or higher
- Verify all environment variables are properly set

### API Issues
- Confirm your Gemini API key is valid and has sufficient quota
- Check browser console for detailed error messages
- Ensure API key is properly prefixed with `VITE_` for Vite

### Deployment Issues
- Verify Vercel project is not set to private/protected
- Confirm environment variables are set in Vercel dashboard
- Check deployment logs for specific error messages
