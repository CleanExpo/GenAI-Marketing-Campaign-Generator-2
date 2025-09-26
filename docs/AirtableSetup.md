# Airtable CRM Integration Setup Guide

This guide will help you set up your Airtable base to work seamlessly with the ZENITH AI Marketing Campaign Generator.

## Prerequisites

- An Airtable account (free or paid)
- A new or existing Airtable base
- Basic familiarity with Airtable

## Step 1: Create Your Airtable Base

1. Go to [airtable.com](https://airtable.com)
2. Create a new base or use an existing one
3. Note your Base ID from the URL: `https://airtable.com/YOUR_BASE_ID/...`

## Step 2: Set Up Required Tables

Your Airtable base needs these four tables with the following structure:

### 📋 **Contacts** Table

| Field Name | Field Type | Description |
|------------|------------|-------------|
| Email | Email | Primary email address |
| First Name | Single line text | Contact's first name |
| Last Name | Single line text | Contact's last name |
| Company | Link to another record | Link to Companies table |
| Phone | Phone number | Contact phone |
| ZENITH Contact ID | Single line text | Auto-populated by ZENITH |

### 🏢 **Companies** Table

| Field Name | Field Type | Description |
|------------|------------|-------------|
| Name | Single line text | Company name |
| Domain | URL | Company website |
| Industry | Single select | Industry category |
| Size | Single select | Company size (1-10, 11-50, 51-200, etc.) |
| ZENITH Company ID | Single line text | Auto-populated by ZENITH |

### 💼 **Deals** Table

| Field Name | Field Type | Description |
|------------|------------|-------------|
| Name | Single line text | Deal name |
| Amount | Currency | Deal value |
| Stage | Single select | Pipeline stage (New, Qualified, Proposal, Closed Won, Closed Lost) |
| Close Date | Date | Expected close date |
| Contact | Link to another record | Link to Contacts table |
| Company | Link to another record | Link to Companies table |
| ZENITH Deal ID | Single line text | Auto-populated by ZENITH |

### 📊 **Campaigns** Table

| Field Name | Field Type | Description |
|------------|------------|-------------|
| Name | Single line text | Campaign name |
| Type | Single select | Campaign type (Email, Social, Web, etc.) |
| Status | Single select | Campaign status (Planning, Active, Paused, Completed) |
| Start Date | Date | Campaign start date |
| End Date | Date | Campaign end date |
| Budget | Currency | Campaign budget |
| ZENITH Campaign ID | Single line text | Auto-populated by ZENITH |

## Step 3: Create an API Token

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens)
2. Click "Create new token"
3. Give your token a name (e.g., "ZENITH Integration")
4. Select the following scopes:
   - **data.records:read** - Read records
   - **data.records:write** - Create, update, and delete records
   - **schema.bases:read** - Read base schema (optional, for custom fields)
5. Add your base to the token access list
6. Click "Create token"
7. **Important**: Copy and save your token immediately - you won't be able to see it again!

## Step 4: Configure ZENITH Connection

1. In the ZENITH app, click the "🔗 CRM" button in the header
2. Click "➕ Add Connection"
3. Select "Airtable" from the provider dropdown
4. Enter your **Base ID** (from Step 1)
5. Enter your **API Key** (from Step 3)
6. Click "Add Connection"
7. Click "🧪 Test" to verify the connection

## Step 5: Enable Auto-Sync (Optional)

To automatically sync campaigns to Airtable:

1. In the CRM Manager, find your Airtable connection
2. Toggle the switch to "Active"
3. Your campaigns will now automatically sync to the Campaigns table

## Field Mapping

ZENITH automatically maps campaign data to your Airtable fields:

### Campaign Sync Mapping
- **Campaign Name** → `Name` field
- **Campaign Description** → Custom field or notes
- **Product Description** → Custom field
- **Status** → `Status` field (draft → Planning, active → Active)
- **Created Date** → `Start Date` field
- **Tags** → Custom field (comma-separated)
- **ZENITH Campaign ID** → `ZENITH Campaign ID` field

## Advanced Configuration

### Custom Fields
You can add custom fields to any table. ZENITH will automatically detect and sync additional fields when possible.

### Linked Records
The base structure uses linked records between tables for better data relationships:
- Contacts link to Companies
- Deals link to both Contacts and Companies
- This creates a complete CRM relationship structure

### Views and Filtering
Create custom views in Airtable to:
- Filter campaigns by status or date
- Sort deals by amount or close date
- Group contacts by company
- Track campaign performance over time

## Troubleshooting

### Common Issues

**❌ "Invalid Base ID"**
- Verify your Base ID is correct (starts with "app")
- Ensure the base exists and you have access

**❌ "Permission Denied"**
- Check that your API token has the correct scopes
- Verify the base is added to your token's access list

**❌ "Table Not Found"**
- Ensure all required tables exist with exact names
- Table names are case-sensitive: "Contacts", "Companies", "Deals", "Campaigns"

**❌ "Field Not Found"**
- Check that all required fields exist in each table
- Field names must match exactly as specified above

### Support

If you encounter issues:
1. Test your connection using the built-in test feature
2. Check the browser console for detailed error messages
3. Verify your Airtable base structure matches this guide
4. Ensure your API token hasn't expired

## Security Notes

- API tokens should be treated as passwords - never share them
- Tokens can be regenerated if compromised
- Consider using workspace-level tokens for team access
- Review token permissions regularly

## Next Steps

Once connected, ZENITH will automatically:
- ✅ Sync new campaigns to your Campaigns table
- ✅ Update existing campaigns when modified
- ✅ Maintain data relationships between tables
- ✅ Preserve your custom fields and data

Your Airtable CRM is now ready to work with ZENITH! 🚀