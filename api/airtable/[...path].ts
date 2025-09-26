import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get environment variables from Vercel
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_TOKEN || !AIRTABLE_BASE_ID) {
      return res.status(500).json({
        error: 'Airtable configuration missing. Please set AIRTABLE_TOKEN and AIRTABLE_BASE_ID in Vercel environment variables.'
      });
    }

    // Extract the Airtable API path from the request
    const { path } = req.query;
    let airtablePath = '';

    if (Array.isArray(path)) {
      airtablePath = path.join('/');
    } else if (path) {
      airtablePath = path;
    }

    // If the path doesn't start with the base ID, prepend it for table operations
    if (!airtablePath.startsWith('meta/') && !airtablePath.startsWith(AIRTABLE_BASE_ID)) {
      airtablePath = `${AIRTABLE_BASE_ID}/${airtablePath}`;
    }

    // Construct the full Airtable API URL
    const airtableUrl = `https://api.airtable.com/v0/${airtablePath}${req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`;

    // Forward the request to Airtable
    const airtableResponse = await fetch(airtableUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ZENITH-CRM-Integration/1.0'
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
    });

    const data = await airtableResponse.json();

    // Return the response with the same status code
    res.status(airtableResponse.status).json(data);

  } catch (error: any) {
    console.error('Airtable API proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}