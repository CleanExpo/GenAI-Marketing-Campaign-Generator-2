# Airtable Staff Table 403 Forbidden Resolution Guide

## 🔍 Issues Identified

### Critical Issues
1. **Staff Table Access Denied (403 Forbidden)**
   - Table exists but API token lacks permission
   - Staff management features completely unavailable
   - 4 additional enterprise tables also forbidden

2. **Table Structure Mismatches**
   - Campaigns table exists but has no expected fields
   - Field name mismatches prevent write operations
   - Application code expects different schema than actual base

3. **API Token Limitations**
   - Limited table access (6 accessible, 5 forbidden)
   - Write operations failing due to unknown fields
   - Token may have restrictive base-level permissions

## 📊 Current State Analysis

### ✅ Accessible Tables (6)
- **Campaigns** - Empty structure, no expected fields
- **Projects** - Has proper structure but date field issues
- **Clients** - Working structure, missing Description field
- **Contacts** - Minimal structure (Company, Deals)
- **Companies** - Basic structure (Name, Domain)
- **Deals** - Basic structure (Contact, Company)

### ❌ Forbidden Tables (5)
- **Staff** - 403 Forbidden ⚠️ CRITICAL
- **Approvals** - 403 Forbidden
- **Activity_Logs** - 403 Forbidden
- **Assignments** - 403 Forbidden
- **Milestones** - 403 Forbidden

## 🔧 Resolution Steps

### Step 1: Fix API Token Permissions

#### Option A: Generate New Personal Access Token
1. Go to https://airtable.com/create/tokens
2. Create new token with name: "Marketing Campaign Generator - Full Access"
3. Add these scopes:
   ```
   data.records:read
   data.records:write
   schema.bases:read
   ```
4. Grant access to your base: `app7oLoqjWJjWlfCq`
5. Replace the API key in environment variables

#### Option B: Check Current Token Permissions
1. Go to https://airtable.com/account/tokens
2. Find your current token
3. Verify it has full access to the base
4. Check if specific tables are restricted

### Step 2: Resolve Staff Table Access

#### Quick Test Script
```bash
cd "D:\AI Marketing Campaign\GenAI-Marketing-Campaign-Generator-2"
node debug-airtable.js
```

If Staff table is still forbidden after new token:

#### Option A: Create New Staff Table
```json
{
  "tableName": "Staff",
  "fields": [
    {"name": "Email", "type": "email"},
    {"name": "Name", "type": "singleLineText"},
    {"name": "Role", "type": "singleSelect", "options": ["Admin", "Manager", "Creator", "Viewer"]},
    {"name": "Department", "type": "singleLineText"},
    {"name": "Phone", "type": "phoneNumber"},
    {"name": "Profile Photo", "type": "multipleAttachments"},
    {"name": "Active", "type": "checkbox"},
    {"name": "Last Activity", "type": "dateTime"},
    {"name": "Workload Score", "type": "number", "options": {"precision": 0}},
    {"name": "Performance Rating", "type": "number", "options": {"precision": 0}},
    {"name": "Assigned Projects", "type": "multipleRecordLinks", "linkedTableId": "Projects"}
  ]
}
```

#### Option B: Duplicate Existing Base
1. Create new base from template
2. Set up proper permissions
3. Update BASE_ID in environment

### Step 3: Fix Campaigns Table Structure

The Campaigns table is accessible but empty. Add these fields:

```json
{
  "fieldsToAdd": [
    {"name": "Title", "type": "singleLineText"},
    {"name": "Description", "type": "longText"},
    {"name": "Status", "type": "singleSelect", "options": ["Draft", "In Review", "Approved", "In Production", "Completed", "Archived"]},
    {"name": "Priority", "type": "singleSelect", "options": ["Low", "Medium", "High", "Urgent"]},
    {"name": "Client", "type": "multipleRecordLinks", "linkedTableId": "Clients"},
    {"name": "Assigned Staff", "type": "multipleRecordLinks", "linkedTableId": "Staff"},
    {"name": "Created By", "type": "multipleRecordLinks", "linkedTableId": "Staff"},
    {"name": "Due Date", "type": "date"},
    {"name": "Budget", "type": "currency"},
    {"name": "Tags", "type": "singleLineText"},
    {"name": "Campaign Data", "type": "longText"},
    {"name": "Project", "type": "multipleRecordLinks", "linkedTableId": "Projects"},
    {"name": "Estimated Hours", "type": "number"},
    {"name": "Actual Hours", "type": "number"},
    {"name": "Completion Percentage", "type": "percent"}
  ]
}
```

### Step 4: Create Missing Enterprise Tables

Create these tables for full functionality:

#### Approvals Table
```json
{
  "tableName": "Approvals",
  "fields": [
    {"name": "Campaign", "type": "multipleRecordLinks", "linkedTableId": "Campaigns"},
    {"name": "Approved By", "type": "multipleRecordLinks", "linkedTableId": "Staff"},
    {"name": "Status", "type": "singleSelect", "options": ["Pending", "Approved", "Rejected", "Requires Changes"]},
    {"name": "Comments", "type": "longText"},
    {"name": "Timestamp", "type": "dateTime"},
    {"name": "Version", "type": "number"}
  ]
}
```

#### Activity_Logs Table
```json
{
  "tableName": "Activity_Logs",
  "fields": [
    {"name": "Staff", "type": "multipleRecordLinks", "linkedTableId": "Staff"},
    {"name": "Action", "type": "singleSelect", "options": ["Campaign Created", "Campaign Updated", "Campaign Approved", "Project Assigned", "Task Completed", "Client Contact", "File Uploaded"]},
    {"name": "Resource ID", "type": "singleLineText"},
    {"name": "Resource Type", "type": "singleSelect", "options": ["Campaign", "Project", "Client", "Task"]},
    {"name": "Details", "type": "longText"},
    {"name": "Metadata", "type": "longText"},
    {"name": "Timestamp", "type": "dateTime"},
    {"name": "IP Address", "type": "singleLineText"},
    {"name": "User Agent", "type": "longText"}
  ]
}
```

### Step 5: Update Environment Variables

Update your `.env.local` file:
```bash
VITE_AIRTABLE_API_KEY=your_new_token_here
VITE_AIRTABLE_BASE_ID=app7oLoqjWJjWlfCq
```

### Step 6: Test Resolution

Run the verification script:
```bash
node test-api-permissions.js
```

Expected results after fixes:
- ✅ All tables accessible
- ✅ Write operations successful
- ✅ Staff management functional

## 🚨 Alternative Solutions

### Option 1: Create New Base
If table structure conflicts are too complex:

1. Create new base with proper structure
2. Import essential data from current base
3. Update BASE_ID in application
4. Follow table structure templates above

### Option 2: Modify Application Code
If you prefer to keep existing structure:

1. Update `airtableService.ts` field mappings
2. Map application fields to actual Airtable fields
3. Update all CRUD operations
4. Test thoroughly

### Option 3: Use Different CRM Provider
The application supports multiple CRM providers:

1. Consider using HubSpot or Salesforce
2. Update `crmIntegration.ts` configuration
3. Configure appropriate API credentials

## 🧪 Testing Commands

```bash
# Test connection
node debug-airtable.js

# Test permissions
node test-api-permissions.js

# Inspect table structures
node inspect-campaigns.js

# Start application
npm run dev
```

## 📋 Verification Checklist

- [ ] New API token generated with full permissions
- [ ] Staff table accessible (no 403 errors)
- [ ] Campaigns table has all required fields
- [ ] Write operations successful on all tables
- [ ] Staff management component loads without errors
- [ ] Campaign creation works end-to-end
- [ ] All enterprise features functional

## 🔗 Resources

- [Airtable API Tokens](https://airtable.com/create/tokens)
- [Base Schema Documentation](https://airtable.com/developers/web/api/introduction)
- [Application Documentation](./CLAUDE.md)

---

**Priority Actions:**
1. 🔴 **IMMEDIATE**: Generate new API token with full permissions
2. 🟡 **HIGH**: Add missing fields to Campaigns table
3. 🟢 **MEDIUM**: Create missing enterprise tables for full functionality