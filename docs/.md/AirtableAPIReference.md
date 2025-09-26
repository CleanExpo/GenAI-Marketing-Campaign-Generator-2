# Airtable API Reference Documentation

## Authentication & Configuration

### API Key Authentication
```javascript
// Global configuration
Airtable.configure({ apiKey: 'YOUR_SECRET_API_TOKEN' })

// Per-connection configuration
const airtable = new Airtable({
  apiKey: 'YOUR_SECRET_API_TOKEN',
  endpointUrl: 'https://api.airtable.com/v0' // optional
})

// Environment variable setup
export AIRTABLE_API_KEY=YOUR_SECRET_API_TOKEN
```

### Configuration Options
```javascript
Airtable.configure(options: object)
  options:
    apiKey: string (required)
      Description: Your secret API token. Can be a personal access token or OAuth access token.
      Source: https://airtable.com/create/tokens
    endpointUrl: string (optional)
      Description: The API endpoint to hit. Useful for overriding the default, e.g., for debugging with an API proxy.
      Environment Variable: AIRTABLE_ENDPOINT_URL
    requestTimeout: number (optional)
      Description: The timeout in milliseconds for API requests.
      Default: 300000 (5 minutes)
```

## API Endpoints Structure

### Base URL Structure
```
https://api.airtable.com/v0/{baseId}/{tableIdOrName}
```

### Rate Limits
- **5 requests per second, per base** (across all pricing tiers)
- Increased rate limits are not currently available

### Common Request Headers
```javascript
{
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json'
}
```

## Error Codes and Troubleshooting

### HTTP Status Codes

#### Success Codes (2xx)
- **200 OK**: Request completed successfully
- **201 Created**: Record created successfully

#### Client Error Codes (4xx)
- **400 Bad Request**: Invalid JSON or malformed request
- **401 Unauthorized**: Missing or invalid API token
- **403 Forbidden**: Insufficient permissions or resource not found
- **404 Not Found**: Route or resource doesn't exist
- **406 Blocked**: Request blocked for security reasons
- **413 Request Entity Too Large**: Payload size exceeded
- **422 Invalid Request**: Invalid request body or parameters

#### Server Error Codes (5xx)
- **500 Internal Server Error**: Unexpected server condition
- **502 Bad Gateway**: Servers restarting or outage
- **503 Service Unavailable**: Server timeout, safe to retry

### Error Response Format
```json
{
  "error": {
    "type": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

### Common Error Types

#### Authentication Errors (401)
```json
{
  "error": {
    "type": "AUTHENTICATION_REQUIRED",
    "message": "The access token was not present in the request, or it was passed incorrectly."
  }
}
```

#### Permission Errors (403)
```json
{
  "error": {
    "type": "INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND",
    "message": "Invalid permissions, or the requested model was not found. Check that both your user and your token have the required permissions, and that the model names and/or ids are correct."
  }
}
```

#### Invalid Request (422)
```json
{
  "error": {
    "type": "INVALID_REQUEST_BODY",
    "message": "Something is wrong with the request body."
  }
}
```

## ID Structure

### Airtable URL Pattern
```
https://airtable.com/{BASE_ID}/{TABLE_ID}/{VIEW_ID}
```

### ID Prefixes
- **Base IDs**: Begin with `app` (e.g., `appXXXXXXXXXXXXXX`)
- **Table IDs**: Begin with `tbl` (e.g., `tblXXXXXXXXXXXXXX`)
- **View IDs**: Begin with `viw` (e.g., `viwXXXXXXXXXXXXXX`)
- **Record IDs**: Begin with `rec` (e.g., `recXXXXXXXXXXXXXX`)

## CRUD Operations

### Create Records
```javascript
// Single record
POST /v0/{baseId}/{tableIdOrName}
{
  "fields": {
    "Name": "John Doe",
    "Email": "john@example.com"
  },
  "typecast": true
}

// Multiple records
POST /v0/{baseId}/{tableIdOrName}
{
  "records": [
    { "fields": { "Name": "John Doe" } },
    { "fields": { "Name": "Jane Doe" } }
  ],
  "typecast": true
}
```

### Read Records
```javascript
// List all records
GET /v0/{baseId}/{tableIdOrName}

// With parameters
GET /v0/{baseId}/{tableIdOrName}?maxRecords=100&sort[0][field]=Name&sort[0][direction]=asc

// Filter by formula
GET /v0/{baseId}/{tableIdOrName}?filterByFormula=AND({Status}='Active',{Priority}>5)
```

### Update Records
```javascript
// Update single record
PATCH /v0/{baseId}/{tableIdOrName}/{recordId}
{
  "fields": {
    "Name": "Updated Name"
  },
  "typecast": true
}

// Batch update
PATCH /v0/{baseId}/{tableIdOrName}
{
  "records": [
    {
      "id": "recXXXXXXXXXXXXXX",
      "fields": { "Status": "Updated" }
    }
  ],
  "typecast": true
}
```

### Delete Records
```javascript
// Delete single record
DELETE /v0/{baseId}/{tableIdOrName}/{recordId}

// Batch delete
DELETE /v0/{baseId}/{tableIdOrName}?records[]=recXXX&records[]=recYYY
```

## Query Parameters

### Common Parameters
- **maxRecords**: Maximum number of records to return (1-100)
- **pageSize**: Number of records per page (1-100, default: 100)
- **offset**: For pagination, token from previous response
- **view**: Return records from a specific view
- **sort**: Array of sort objects `[{"field": "Name", "direction": "asc"}]`
- **filterByFormula**: Airtable formula for filtering records
- **fields**: Array of field names to include in response
- **typecast**: Automatically convert field values to appropriate types

### Filter Formula Examples
```javascript
// Single condition
filterByFormula: "{Status} = 'Active'"

// Multiple conditions
filterByFormula: "AND({Status} = 'Active', {Priority} > 5)"

// Text search
filterByFormula: "FIND('search term', {Description})"

// Date filtering
filterByFormula: "IS_AFTER({Created}, '2023-01-01')"
```

## Base Schema API

### Get Base Schema
```javascript
GET /v0/meta/bases/{baseId}/tables
```

### Response Structure
```json
{
  "tables": [
    {
      "id": "tblXXXXXXXXXXXXXX",
      "name": "Table Name",
      "primaryFieldId": "fldXXXXXXXXXXXXXX",
      "fields": [
        {
          "id": "fldXXXXXXXXXXXXXX",
          "name": "Field Name",
          "type": "singleLineText"
        }
      ],
      "views": [
        {
          "id": "viwXXXXXXXXXXXXXX",
          "name": "View Name",
          "type": "grid"
        }
      ]
    }
  ]
}
```

## Best Practices

### Error Handling
```javascript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  return await response.json();
} catch (error) {
  console.error('API request failed:', error);
  // Handle specific error types
  if (error.status === 401) {
    // Handle authentication error
  } else if (error.status === 403) {
    // Handle permission error
  }
}
```

### Rate Limiting
```javascript
// Implement rate limiting with delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function makeRateLimitedRequest(url, options) {
  await delay(200); // 200ms between requests (5 req/sec)
  return fetch(url, options);
}
```

### Batch Operations
```javascript
// Process records in batches of 10 (Airtable limit)
const batchSize = 10;
for (let i = 0; i < records.length; i += batchSize) {
  const batch = records.slice(i, i + batchSize);
  await processBatch(batch);
}
```

## Troubleshooting Checklist

### Connection Issues
1. **Verify Base ID format**: Must start with `app` and be 17 characters
2. **Check API Key**: Must be valid personal access token or OAuth token
3. **Confirm permissions**: Token must have access to the base
4. **Validate table names**: Must exist and match exactly (case-sensitive)
5. **Test endpoint**: Use `/v0/meta/bases/{baseId}/tables` to verify access

### Permission Issues
1. **User access**: User must be a collaborator on the base
2. **Token scopes**: Must include required permissions (read/write)
3. **Table permissions**: Check table-level permission restrictions
4. **Field permissions**: Verify field-level editing permissions

### Data Issues
1. **Field names**: Must match exactly as defined in Airtable
2. **Data types**: Use `typecast: true` for automatic conversion
3. **Required fields**: Ensure all required fields are included
4. **Linked records**: Verify target records exist and are accessible

### Rate Limiting
1. **Monitor requests**: Stay under 5 requests per second per base
2. **Implement backoff**: Use exponential backoff for retries
3. **Batch operations**: Use batch endpoints when available
4. **Cache results**: Avoid redundant API calls