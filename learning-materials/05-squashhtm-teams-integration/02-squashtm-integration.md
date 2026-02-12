# SquashTM Integration

Integrate Cypress tests with SquashTM for automated test result reporting.

---

## How It Works

```
Cypress Test Run          SquashTM API
     │                          │
     ├── 1. Login ─────────────▶│
     ├── 2. Create Iteration ──▶│
     ├── 3. Add Test Case ─────▶│
     ├── 4. Create Execution ──▶│
     ├── 5. Update Status ─────▶│
     └── 6. Finish ────────────▶│
```

---

## Prerequisites

1. SquashTM running locally (http://localhost:8080)
2. API Token generated in SquashTM
3. At least one project with test cases
4. Install dependency: `npm install axios` or `yarn add axios`

---

## Step 1: Generate API Token

1. Open SquashTM: `http://localhost:8080/squash`
2. Login → Click **username** (top right) → **My Account**
3. Go to **API Tokens** tab
4. Click **Generate new token**
5. Save the token (used in next step)

---

## Step 2: Find Your IDs

Before running, you need to find your Campaign ID and Project ID from SquashTM.

### Finding Campaign ID

Look at the URL when viewing a campaign:
```
http://localhost:8080/squash/campaign-workspace/campaign/1/dashboard
```
The number after `/campaign/` is your campaign ID (e.g., `1`).

### Finding Project ID

Look at the URL when viewing a project:
```
http://localhost:8080/squash/project-workspace/1/test-case-workspace
```
The number after `/project-workspace/` is your project ID (e.g., `1`).

---

## Step 3: Save Token

Create file `apitoken.txt` in project root:

```
eyJhbGciOiJIUzUxMiJ9... (your token here)
```

---

## Step 4: Add Test Steps in SquashTM

**Important:** Test cases need steps before execution.

1. SquashTM → **Projects** → Your project
2. **Test Cases** tab
3. Click on a test case
4. Add at least one step:
   - Step 1: "Verify API returns 200"
   - Expected result: "Status code is 200"
5. Save

---

## Step 5: API Client Setup

File: `cypress/support/squash-api.js`

```javascript
const axios = require('axios');

class SquashAPI {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:8080';
    this.apiToken = config.apiToken || null;
  }

  getAuthHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    return headers;
  }

  async login() {
    const preLogin = await axios.get(`${this.baseUrl}/squash/login`, {
      withCredentials: true
    });

    const cookies = preLogin.headers['set-cookie'];
    let xsrfToken = '';
    if (cookies) {
      const xsrfMatch = cookies.find(c => c.includes('XSRF-TOKEN'));
      if (xsrfMatch) {
        xsrfToken = xsrfMatch.split(';')[0].split('=')[1];
      }
    }

    const loginResponse = await axios.post(
      `${this.baseUrl}/squash/backend/login`,
      new URLSearchParams({ username: 'admin', password: 'admin' }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-XSRF-TOKEN': xsrfToken,
          'Cookie': `XSRF-TOKEN=${xsrfToken}`
        },
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      }
    );

    const sessionCookies = loginResponse.headers['set-cookie'];
    let sessionCookie = '';
    if (sessionCookies) {
      const jsessionMatch = sessionCookies.find(c => c.includes('JSESSIONID'));
      if (jsessionMatch) {
        sessionCookie = jsessionMatch.split(';')[0];
      }
    }

    this.sessionCookie = sessionCookie;
    this.xsrfToken = xsrfToken;
    return true;
  }

  async createIteration(campaignId, name = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const iterationName = name || `[Auto]-${timestamp}`;

    const response = await axios.post(
      `${this.baseUrl}/squash/api/rest/latest/campaigns/${campaignId}/iterations`,
      {
        _type: 'iteration',
        name: iterationName,
        status: 'IN_PROGRESS',
        actual_start_auto: false,
        actual_end_auto: false
      },
      {
        headers: this.getAuthHeaders(),
        withCredentials: true
      }
    );

    return {
      id: response.data.id,
      name: iterationName
    };
  }

  async getTestCases(projectId) {
    const response = await axios.get(
      `${this.baseUrl}/squash/api/rest/latest/test-cases?projectId=${projectId}`,
      {
        headers: this.getAuthHeaders(),
        withCredentials: true
      }
    );
    return response.data;
  }

  async addTestCaseToIteration(iterationId, testCaseId) {
    const response = await axios.post(
      `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}/test-plan`,
      {
        _type: 'campaign-test-plan-item',
        test_case: {
          _type: 'test-case',
          id: testCaseId
        }
      },
      {
        headers: this.getAuthHeaders(),
        withCredentials: true
      }
    );

    return { id: response.data.id };
  }

  async getIterationTestPlan(iterationId) {
    const response = await axios.get(
      `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}/test-plan`,
      {
        headers: this.getAuthHeaders(),
        withCredentials: true
      }
    );
    return response.data;
  }

  async createExecution(testPlanItemId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/squash/api/rest/latest/test-plan-items/${testPlanItemId}/executions`,
        {
          _type: 'execution',
          execution_mode: 'AUTOMATED'
        },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );

      return {
        id: response.data.id
      };
    } catch (error) {
      if (error.response?.data?.message === 'Execution has no steps') {
        console.log('⚠️ Test case has no steps in SquashTM');
        return null;
      }
      throw error;
    }
  }

  async updateExecutionStatus(executionId, status) {
    const validStatuses = ['SUCCESS', 'FAILURE', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const response = await axios.patch(
      `${this.baseUrl}/squash/api/rest/latest/executions/${executionId}`,
      {
        _type: 'execution',
        execution_status: status
      },
      {
        headers: this.getAuthHeaders(),
        withCredentials: true
      }
    );

    return { id: response.data.id, status };
  }

  async finishIteration(iterationId) {
    const response = await axios.patch(
      `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}`,
      { status: 'FINISHED' },
      {
        headers: this.getAuthHeaders(),
        withCredentials: true
      }
    );
    return response.data;
  }
}

module.exports = { SquashAPI };
```

---

## Step 6: Test Script

File: `scripts/test-squash-api.js`

```javascript
const { SquashAPI } = require('../cypress/support/squash-api');
const fs = require('fs');

async function test() {
  const apiToken = fs.readFileSync('./apitoken.txt', 'utf8').trim();

  const api = new SquashAPI({
    baseUrl: 'http://localhost:8080',
    apiToken: apiToken
  });

  // 1. Login
  console.log('1. Logging in...');
  await api.login();

  // 2. Use existing campaign - UPDATE THIS to your campaign ID
  const campaignId = 1;  // <-- Change this to your campaign ID
  console.log(`2. Using campaign ID: ${campaignId}`);

  // 3. Create iteration
  console.log('3. Creating iteration...');
  const iteration = await api.createIteration(campaignId);
  console.log('Created:', iteration);

  // 4. Get test cases - UPDATE THIS to your project ID
  console.log('4. Fetching test cases...');
  const projectId = 1;  // <-- Change this to your project ID
  const testCases = await api.getTestCases(projectId);

  if (testCases._embedded?.['test-cases']?.length > 0) {
    const testCaseId = testCases._embedded['test-cases'][0].id;
    console.log('Using test case ID:', testCaseId);

    // 5. Add to iteration
    console.log('5. Adding test case to iteration...');
    await api.addTestCaseToIteration(iteration.id, testCaseId);

    // 6. Get test plan item
    console.log('6. Getting test plan...');
    const testPlan = await api.getIterationTestPlan(iteration.id);
    const tpItem = testPlan._embedded['test-plan'][0];

    // 7. Create execution
    console.log('7. Creating execution...');
    const execution = await api.createExecution(tpItem.id);

    if (execution) {
      // 8. Update status
      console.log('8. Updating status to SUCCESS...');
      await api.updateExecutionStatus(execution.id, 'SUCCESS');
    }

    // 9. Finish iteration
    console.log('9. Finishing iteration...');
    await api.finishIteration(iteration.id);
  }

  console.log('\n✅ Done!');
}

test().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
```

---

## Step 7: Run Test

```bash
node scripts/test-squash-api.js
```

**Expected output:**
```
1. Logging in...
2. Using campaign ID: 1
3. Creating iteration...
Created: { id: 6, name: '[Auto]-2026-02-12T...' }
4. Fetching test cases...
5. Adding test case to iteration...
6. Getting test plan...
7. Creating execution...
8. Updating status to SUCCESS...
9. Finishing iteration...
✅ Done!
```

---

## Step 8: Integrate with Cypress

### Option A: Global Setup (cypress/support/e2e.ts)

```typescript
import { SquashAPI } from './squash-api';
import * as fs from 'fs';

const CAMPAIGN_ID = 1;  // Update to your campaign ID
const PROJECT_ID = 1;   // Update to your project ID

let squashApi: SquashAPI | null = null;
let iterationId: number | null = null;
let testCaseMap: Map<string, number> = new Map();  // Map test names to test case IDs

before(async () => {
  // Initialize API client
  const apiToken = fs.readFileSync('./apitoken.txt', 'utf8').trim();
  squashApi = new SquashAPI({
    baseUrl: 'http://localhost:8080',
    apiToken: apiToken
  });

  // Login to SquashTM
  await squashApi.login();

  // Create iteration for this test run
  const iteration = await squashApi.createIteration(CAMPAIGN_ID, `Cypress Run - ${new Date().toISOString()}`);
  iterationId = iteration.id;

  // Load test case mappings (you can also load from a JSON file)
  const testCases = await squashApi.getTestCases(PROJECT_ID);
  if (testCases._embedded?.['test-cases']) {
    for (const tc of testCases._embedded['test-cases']) {
      testCaseMap.set(tc.name, tc.id);
    }
  }
});

afterEach(async function() {
  if (!squashApi || !iterationId) return;

  const testName = this.currentTest?.title;
  const testCaseId = testCaseMap.get(testName);

  if (testCaseId) {
    // Add test case to iteration
    await squashApi.addTestCaseToIteration(iterationId, testCaseId);

    // Get test plan item
    const testPlan = await squashApi.getIterationTestPlan(iterationId);
    const tpItem = testPlan._embedded?.['test-plan']?.find(
      (item: any) => item.test_case.id === testCaseId
    );

    if (tpItem) {
      // Create execution
      const execution = await squashApi.createExecution(tpItem.id);
      if (execution) {
        // Update status based on test result
        const status = this.currentTest?.state === 'passed' ? 'SUCCESS' : 'FAILURE';
        await squashApi.updateExecutionStatus(execution.id, status);
      }
    }
  }
});

after(async () => {
  if (squashApi && iterationId) {
    await squashApi.finishIteration(iterationId);
  }
});
```

### Option B: Using Test Annotations (Recommended)

Create a custom command to map tests:

**cypress/support/commands.ts:**
```typescript
Cypress.Commands.add('squashTest', (testCaseId: number) => {
  cy.wrap(testCaseId).as('currentSquashTestCaseId');
});
```

**In your test:**
```typescript
it('should login successfully', () => {
  cy.squashTest(123);  // Your SquashTM test case ID
  // ... test code
});
```

---

## Step 9: Test with Postman (Optional)

If you want to test APIs manually in Postman, you need all three authentication components:

### Headers Required

```
Authorization: Bearer YOUR_API_TOKEN
Cookie: JSESSIONID=YOUR_SESSION; XSRF-TOKEN=YOUR_XSRF_TOKEN
X-XSRF-TOKEN: YOUR_XSRF_TOKEN
```

### Getting Session Tokens

1. **Get XSRF Token:**
   ```bash
   curl -i http://localhost:8080/squash/login
   # Look for Set-Cookie: XSRF-TOKEN=...
   ```

2. **Login to get JSESSIONID:**
   ```bash
   curl -i -X POST http://localhost:8080/squash/backend/login \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -H "X-XSRF-TOKEN: YOUR_XSRF_TOKEN" \
     -H "Cookie: XSRF-TOKEN=YOUR_XSRF_TOKEN" \
     -d "username=admin&password=admin"
   # Look for Set-Cookie: JSESSIONID=...
   ```

3. **Use in Postman:**
   - Add `Authorization: Bearer YOUR_API_TOKEN`
   - Add `Cookie: JSESSIONID=xxx; XSRF-TOKEN=yyy`
   - Add `X-XSRF-TOKEN: yyy`

---

## Using in Other Repos

To use this integration in another project:

### 1. Copy Required Files

```
cypress/support/squash-api.js       # API client
scripts/test-squash-api.js          # Test script (optional)
apitoken.txt                        # Your API token (add to .gitignore!)
```

### 2. Install Dependency

```bash
npm install axios
```

### 3. Update IDs

Edit the script to use your campaign and project IDs.

### 4. Environment Variables (Recommended for CI)

Instead of `apitoken.txt`, use environment variables:

```javascript
const apiToken = process.env.SQUASH_API_TOKEN;
const baseUrl = process.env.SQUASH_URL || 'http://localhost:8080';
```

---

## API Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/backend/login` | Authenticate |
| POST | `/campaigns/{id}/iterations` | Create iteration |
| GET | `/test-cases?projectId={id}` | List test cases |
| POST | `/iterations/{id}/test-plan` | Add test case |
| POST | `/test-plan-items/{id}/executions` | Create execution |
| PATCH | `/executions/{id}` | Update status |
| PATCH | `/iterations/{id}` | Finish iteration |

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Execution has no steps" | Add steps to test case in SquashTM UI |
| "No entity known for type campaign-folder" | Use existing campaign ID (check UI) |
| "Unauthorized" / 401 | Check API token is valid and not expired |
| 401 on API calls | Run `api.login()` first to get session |
| 401 in Postman | Include all headers: Authorization + Cookie + X-XSRF-TOKEN |
| "Test case not found" | Check project ID and test case exist |
| Cannot find module 'axios' | Run `npm install axios` |

---

## Next Steps

- [ ] Integrate with GitHub Actions
- [ ] Map multiple test cases by name/ID
- [ ] Add error screenshots to executions
- [ ] Auto-create test cases from Cypress specs
- [ ] Add retry logic for API failures
