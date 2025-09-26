import { VercelRequest, VercelResponse } from '@vercel/node';
import Airtable from 'airtable';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for the frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get environment variables from Vercel - using correct Airtable.js variable names
    const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return res.status(500).json({
        error: 'Airtable configuration missing. Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in Vercel environment variables.'
      });
    }

    // Configure Airtable with the API key
    const airtable = new Airtable({ apiKey: AIRTABLE_API_KEY });
    const base = airtable.base(AIRTABLE_BASE_ID);

    // Extract the path from the request
    const { path } = req.query;
    let requestPath = '';

    if (Array.isArray(path)) {
      requestPath = path.join('/');
    } else if (path) {
      requestPath = path;
    }

    // Handle meta requests (like connection testing)
    if (requestPath.startsWith(`meta/bases/${AIRTABLE_BASE_ID}/tables`)) {
      try {
        // Use Airtable.js to get base schema - this is a connection test
        const tables = await new Promise((resolve, reject) => {
          // Get a sample of records from any table to verify connection
          base('Campaigns').select({ maxRecords: 1 }).firstPage((err, records) => {
            if (err) {
              reject(err);
            } else {
              // If we can access records, connection is good
              resolve({
                tables: [
                  { id: 'tblCampaigns', name: 'Campaigns' },
                  { id: 'tblContacts', name: 'Contacts' },
                  { id: 'tblCompanies', name: 'Companies' },
                  { id: 'tblDeals', name: 'Deals' }
                ]
              });
            }
          });
        });
        return res.status(200).json(tables);
      } catch (error: any) {
        return res.status(401).json({
          error: {
            type: 'AUTHENTICATION_REQUIRED',
            message: 'Invalid API key or base ID'
          }
        });
      }
    }

    // Handle table operations
    const pathParts = requestPath.split('/');
    const tableName = pathParts[0] || 'Campaigns';

    switch (req.method) {
      case 'GET':
        try {
          const records = await new Promise((resolve, reject) => {
            base(tableName).select().firstPage((err, records) => {
              if (err) reject(err);
              else resolve({ records: records?.map(record => ({
                id: record.id,
                fields: record.fields,
                createdTime: record.get('createdTime')
              })) });
            });
          });
          res.status(200).json(records);
        } catch (error: any) {
          res.status(400).json({ error: { message: error.message } });
        }
        break;

      case 'POST':
        try {
          const { fields } = req.body;
          const createdRecord = await new Promise((resolve, reject) => {
            base(tableName).create(fields, (err, record) => {
              if (err) reject(err);
              else resolve({
                id: record?.id,
                fields: record?.fields,
                createdTime: record?.get('createdTime')
              });
            });
          });
          res.status(201).json(createdRecord);
        } catch (error: any) {
          res.status(400).json({ error: { message: error.message } });
        }
        break;

      case 'PATCH':
        try {
          const recordId = pathParts[1];
          const { fields } = req.body;
          const updatedRecord = await new Promise((resolve, reject) => {
            base(tableName).update(recordId, fields, (err, record) => {
              if (err) reject(err);
              else resolve({
                id: record?.id,
                fields: record?.fields,
                createdTime: record?.get('createdTime')
              });
            });
          });
          res.status(200).json(updatedRecord);
        } catch (error: any) {
          res.status(400).json({ error: { message: error.message } });
        }
        break;

      case 'DELETE':
        try {
          const recordId = pathParts[1];
          await new Promise((resolve, reject) => {
            base(tableName).destroy(recordId, (err) => {
              if (err) reject(err);
              else resolve(true);
            });
          });
          res.status(200).json({ deleted: true });
        } catch (error: any) {
          res.status(400).json({ error: { message: error.message } });
        }
        break;

      default:
        res.status(405).json({ error: { message: 'Method not allowed' } });
    }

  } catch (error: any) {
    console.error('Airtable API proxy error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}