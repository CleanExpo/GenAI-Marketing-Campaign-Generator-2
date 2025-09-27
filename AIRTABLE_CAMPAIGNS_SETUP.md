# Airtable Campaigns Table Setup Guide

## Issue Identified
The Campaigns table exists but has **no field structure defined**. This is causing the "Failed to load data from Airtable" error in the Campaign Manager.

## Diagnostic Results
- ✅ Airtable connection works
- ✅ Base ID `app7oLoqjWJjWlfCq` is accessible
- ✅ Campaigns table exists with 1 record
- ❌ **Problem**: The record has no fields (empty object `{}`)

## Quick Fix: Manual Field Creation

### Step 1: Open Airtable Base
1. Go to [airtable.com](https://airtable.com)
2. Open base: `app7oLoqjWJjWlfCq`
3. Navigate to the "Campaigns" table

### Step 2: Create Required Fields
Add these fields to your Campaigns table:

#### Core Fields (Required)
1. **Title** - Single line text (Primary field)
2. **Description** - Long text
3. **Status** - Single select with options:
   - Draft
   - In Review
   - Approved
   - In Production
   - Completed
   - Archived
4. **Priority** - Single select with options:
   - Low
   - Medium
   - High
   - Urgent

#### Additional Fields (Optional but Recommended)
5. **Tags** - Single line text
6. **Estimated Hours** - Number
7. **Actual Hours** - Number
8. **Completion Percentage** - Number (0-100)
9. **Due Date** - Date
10. **Budget** - Currency
11. **Campaign Data** - Long text (stores AI-generated content)

### Step 3: Test the Setup
After creating the fields:

1. Delete the existing empty record
2. Refresh the Campaign Manager in your application
3. The error should be resolved

## Alternative: Create New Base
If you prefer to start fresh:

1. Create a new Airtable base
2. Use the pre-built "Marketing Campaign Template" if available
3. Update your `.env.local` with the new Base ID

## Verification Commands
After setup, run these commands to verify:

```bash
# Test the connection
node test-airtable.js

# Test campaign creation (optional)
node setup-campaigns-table.js
```

## Field Mapping Reference
The application expects these Airtable field names:

| Application Field | Airtable Field Name |
|-------------------|---------------------|
| title | Title |
| description | Description |
| status | Status |
| priority | Priority |
| tags | Tags |
| estimatedHours | Estimated Hours |
| actualHours | Actual Hours |
| completionPercentage | Completion Percentage |
| dueDate | Due Date |
| budget | Budget |
| campaignData | Campaign Data |

## Expected Behavior After Fix
- ✅ Campaign Manager loads without errors
- ✅ Can save campaigns to Airtable
- ✅ Team dashboard functionality works
- ✅ Staff assignment features enabled