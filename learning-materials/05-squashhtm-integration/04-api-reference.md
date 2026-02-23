# API Quick Reference

## Key Endpoints

| Action | Method | Endpoint |
|--------|--------|----------|
| Login | POST | `/squash/backend/login` |
| Create Campaign | POST | `/squash/api/rest/latest/campaigns` |
| Create Iteration | POST | `/squash/api/rest/latest/campaigns/{id}/iterations` |
| Add Test to Iteration | POST | `/squash/api/rest/latest/iterations/{id}/test-plan` |
| Create Execution | POST | `/squash/api/rest/latest/test-plan-items/{id}/executions` |
| Update Execution | PATCH | `/squash/api/rest/latest/executions/{id}` |

## Create Campaign

**Endpoint**: `POST /squash/api/rest/latest/campaigns`

```json
{
  "_type": "campaign",
  "name": "Auto-2024-02-23",
  "status": "IN_PROGRESS",
  "parent": {
    "_type": "campaign-folder",
    "id": 4
  }
}
```

**Response**: `{ "_type": "campaign", "id": 123, "name": "Auto-2024-02-23" }`

**Code**: `squash-api.js` → `createCampaign(folderId, name)`

## Create Iteration

**Endpoint**: `POST /squash/api/rest/latest/campaigns/{id}/iterations`

```json
{
  "_type": "iteration",
  "name": "Run 1737641234567",
  "status": "IN_PROGRESS"
}
```

## Report Execution

**Sequence**: Add to iteration → Create execution → Update status

```bash
# 1. Add test case to iteration
POST /iterations/{iterationId}/test-plan
{ "test_case": { "_type": "test-case", "id": 316 } }

# 2. Create execution
POST /test-plan-items/{testPlanItemId}/executions
{ "_type": "execution", "execution_mode": "AUTOMATED" }

# 3. Update status
PATCH /executions/{executionId}
{ "execution_status": "SUCCESS" }
```

## Authentication

Uses **both** session cookie AND Bearer token:

```javascript
headers: {
  "Authorization": "Bearer YOUR_TOKEN",
  "Cookie": "JSESSIONID=...; XSRF-TOKEN=...",
  "X-XSRF-TOKEN": "..."
}
```

## Code Location

All API calls in: `cypress/support/squash-api.js`
