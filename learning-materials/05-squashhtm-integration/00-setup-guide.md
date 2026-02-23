# SquashTM Integration Setup Guide

**Purpose**: Replicate this Cypress → SquashTM integration in any project.

---

## Files to Create

```
cypress/support/
├── squash-api.js          # API client
├── squash-tasks.js        # Task handlers
├── squash-mappings.ts     # Test name → ID mapping
└── e2e.ts                 # Add hooks (modify existing)
```

---

## File 1: `squash-api.js`

```javascript
const axios = require('axios');

class SquashAPI {
  constructor(config) {
    this.baseUrl = config.baseUrl;
    this.username = config.username;
    this.password = config.password;
    this.apiToken = config.apiToken;
    this.xsrfToken = null;
    this.sessionCookie = null;
  }

  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
      'Cookie': this.sessionCookie,
      'X-XSRF-TOKEN': this.xsrfToken,
    };
  }

  async login() {
    // Get XSRF token
    await axios.get(`${this.baseUrl}/squash/login`);

    // Login and get session
    const response = await axios.post(
      `${this.baseUrl}/squash/backend/login`,
      new URLSearchParams({ username: this.username, password: this.password }),
      { withCredentials: true }
    );

    const cookies = response.headers['set-cookie'];
    this.sessionCookie = cookies?.find(c => c.startsWith('JSESSIONID'));
    this.xsrfToken = cookies?.find(c => c.startsWith('XSRF-TOKEN'))?.split('=')[1];
  }

  async createCampaign(folderId, name) {
    const response = await axios.post(
      `${this.baseUrl}/squash/api/rest/latest/campaigns`,
      {
        _type: 'campaign',
        name: name,
        status: 'IN_PROGRESS',
        actual_start_auto: false,
        actual_end_auto: false,
        parent: { _type: 'campaign-folder', id: folderId }
      },
      { headers: this.getAuthHeaders(), withCredentials: true }
    );
    return { id: response.data.id, name: response.data.name };
  }

  async createIteration(campaignId, name) {
    const response = await axios.post(
      `${this.baseUrl}/squash/api/rest/latest/campaigns/${campaignId}/iterations`,
      { _type: 'iteration', name: name },
      { headers: this.getAuthHeaders() }
    );
    return { id: response.data.id, name: response.data.name };
  }

  async addTestCaseToIteration(iterationId, testCaseId) {
    await axios.post(
      `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}/test-plan`,
      { test_case: { _type: 'test-case', id: testCaseId } },
      { headers: this.getAuthHeaders() }
    );
  }

  async getIterationTestPlan(iterationId) {
    const response = await axios.get(
      `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}/test-plan`,
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async createExecution(testPlanItemId) {
    const response = await axios.post(
      `${this.baseUrl}/squash/api/rest/latest/test-plan-items/${testPlanItemId}/executions`,
      { _type: 'execution', execution_mode: 'AUTOMATED' },
      { headers: this.getAuthHeaders() }
    );
    return { id: response.data.id };
  }

  async updateExecutionStatus(executionId, status) {
    await axios.patch(
      `${this.baseUrl}/squash/api/rest/latest/executions/${executionId}`,
      { execution_status: status },
      { headers: this.getAuthHeaders() }
    );
  }

  async finishIteration(iterationId) {
    await axios.patch(
      `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}`,
      { status: 'FINISHED' },
      { headers: this.getAuthHeaders() }
    );
  }
}

module.exports = { SquashAPI };
```

---

## File 2: `squash-tasks.js`

```javascript
const { SquashAPI } = require('./squash-api');

let squashApi = null;
let currentIterationId = null;

module.exports = {
  squashInit: async (config) => {
    squashApi = new SquashAPI(config);
    await squashApi.login();
    return { success: true };
  },

  squashCreateCampaign: async ({ folderId, name }) => {
    const campaign = await squashApi.createCampaign(folderId, name);
    return campaign;
  },

  squashCreateIteration: async ({ campaignId, name }) => {
    const iteration = await squashApi.createIteration(campaignId, name);
    currentIterationId = iteration.id;
    return iteration;
  },

  squashReportResult: async ({ iterationId, testCaseId, status }) => {
    await squashApi.addTestCaseToIteration(iterationId, testCaseId);
    const testPlan = await squashApi.getIterationTestPlan(iterationId);

    const tpItem = testPlan._embedded?.['test-plan']?.find(
      item => item.referenced_test_case?.id === testCaseId
    );

    if (tpItem) {
      const execution = await squashApi.createExecution(tpItem.id);
      await squashApi.updateExecutionStatus(execution.id, status);
      return { success: true, executionId: execution.id };
    }
    return { success: false, reason: 'Test plan item not found' };
  },

  squashFinish: async () => {
    if (currentIterationId) {
      await squashApi.finishIteration(currentIterationId);
      return { success: true };
    }
    return { success: false };
  },
};
```

---

## File 3: `squash-mappings.ts`

```typescript
export const testCaseMappings: Record<string, number> = {
  "Your Test Name": 123,
};

export const getTestCaseId = (testName: string): number | null => {
  return testCaseMappings[testName] || null;
};
```

**How to find test case ID**: Open in SquashTM → URL shows `/test-case/123/info` → ID is `123`

---

## File 4: Modify `cypress.config.ts`

Add to `setupNodeEvents` → `on("task")`:

```typescript
async "squash:init"(config) {
  const tasks = require("./cypress/support/squash-tasks");
  return tasks.squashInit(config);
},
async "squash:createCampaign"({ folderId, name }) {
  const tasks = require("./cypress/support/squash-tasks");
  return tasks.squashCreateCampaign({ folderId, name });
},
async "squash:createIteration"({ campaignId, name }) {
  const tasks = require("./cypress/support/squash-tasks");
  return tasks.squashCreateIteration({ campaignId, name });
},
async "squash:report"({ iterationId, testCaseId, status }) {
  const tasks = require("./cypress/support/squash-tasks");
  return tasks.squashReportResult({ iterationId, testCaseId, status });
},
async "squash:finish"() {
  const tasks = require("./cypress/support/squash-tasks");
  return tasks.squashFinish();
},
```

---

## File 5: Modify `cypress/support/e2e.ts`

Add to your existing e2e.ts:

```typescript
import { getTestCaseId } from "./squash-mappings";

const FOLDER_ID = 4;  // Your SquashTM folder ID
let campaignId: number | null = null;
let iterationId: number | null = null;

before(() => {
  cy.readFile("apitoken.txt").then((apiToken: string) => {
    cy.task("squash:init", {
      baseUrl: "https://your-squashtm-url.com",
      username: "your-username",
      password: "your-password",
      apiToken: apiToken.trim(),
    });

    cy.task("squash:createCampaign", {
      folderId: FOLDER_ID,
      name: `Auto-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    }).then((campaign: any) => {
      campaignId = campaign.id;

      cy.task("squash:createIteration", {
        campaignId: campaign.id,
        name: `Run ${Date.now()}`,
      }).then((iteration: any) => {
        iterationId = iteration.id;
      });
    });
  });
});

afterEach(function () {
  const testName = this.currentTest?.title || "";
  const testCaseId = getTestCaseId(testName);
  if (!testCaseId || !iterationId) return;

  const status = this.currentTest?.state === "passed" ? "SUCCESS" : "FAILURE";
  cy.task("squash:report", { iterationId, testCaseId, status });
});

after(() => {
  if (iterationId) {
    cy.task("squash:finish");
  }
});
```

---

## Configuration Checklist

| Setting | Your Value |
|----------|-----------|
| SquashTM URL | `https://your-squashtm.com` |
| Folder ID | From SquashTM URL |
| Username | Your SquashTM username |
| Password | Your SquashTM password |
| API Token | From SquashTM "My Account" → "API Tokens" |

Create `apitoken.txt` with your token (add to `.gitignore`).

---

## Prerequisites

```bash
npm install axios
```

---

## Usage

1. Create test cases in SquashTM (must have at least 1 step)
2. Add mappings to `squash-mappings.ts`
3. Run tests: `npx cypress run`
4. Check SquashTM: Folder → Campaigns → Latest run

---

## That's It!

Copy these 5 files, update your config, and you're done.
