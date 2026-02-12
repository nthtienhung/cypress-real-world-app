# SquashTM Integration

Auto-report Cypress test results to SquashTM.

---

## How It Works

Cypress tests run in browser, but SquashTM API needs Node.js. We use `cy.task()` as a bridge.

```
Cypress (Browser)          Node.js (Backend)          SquashTM
     │                            │                        │
     │── cy.task("squash:init") ──▶│── login() ────────────▶│
     │── cy.task("squash:report") ─▶│── update status() ────▶│
```

**Why not call API directly from Cypress?** Browser has CORS restrictions and can't access filesystem for API token.

---

## Prerequisites

1. API Token from SquashTM (My Account → API Tokens)
2. Campaign ID (from URL: `/campaign/11/dashboard` → ID is `11`)
3. Test Case IDs (from URL: `/test-case/123/info` → ID is `123`)
4. `npm install axios`

Save token to `apitoken.txt` (add to `.gitignore`)

---

## Architecture

### 3 Layers:

| Layer | File | Purpose |
|-------|------|---------|
| **API Client** | `squash-api.js` | Talks to SquashTM REST API |
| **Tasks** | `squash-tasks.js` | Node.js functions called via `cy.task()` |
| **Cypress Hooks** | `e2e.ts` | Auto-report after each test |

### Data Flow:

1. **Before all tests**: Login → Create iteration in campaign
2. **After each test**: Get test name → Map to test case ID → Report pass/fail
3. **After all tests**: Mark iteration as finished

---

## Setup

### Step 1: Map Test Names to IDs

**File**: `cypress/support/squash-mappings.ts`

Map your Cypress test names to SquashTM test case IDs:

```typescript
export const testCaseMappings: Record<string, number> = {
  "TC-1: gets a list of users": 2,  // "test name": squashtm_id
  "gets a user": 3,
  // add more...
};

export const getTestCaseId = (testName: string): number | null => {
  return testCaseMappings[testName] || null;
};
```

**How to find test case ID**: Open test case in SquashTM, look at URL. `/test-case/123/info` → ID is `123`.

---

### Step 2: Register Tasks

**File**: `cypress.config.ts`

Add to `setupNodeEvents()`:

```typescript
on("task", {
  async "squash:init"(config) {
    const tasks = require("./cypress/support/squash-tasks");
    return tasks.squashInit(config);
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
});
```

This lets you call `cy.task("squash:report", ...)` in tests.

---

### Step 3: Add Cypress Hooks

**File**: `cypress/support/e2e.ts`

```typescript
import { getTestCaseId } from "./squash-mappings";

const CAMPAIGN_ID = 11;  // Your campaign ID
let iterationId: number | null = null;

// Before all: Login and create iteration
before(() => {
  cy.readFile("apitoken.txt").then((token: string) => {
    cy.task("squash:init", {
      baseUrl: "https://your-squashtm.com",
      username: "your-user",
      password: "your-pass",
      apiToken: token.trim(),
    });

    cy.task("squash:createIteration", {
      campaignId: Number(CAMPAIGN_ID),
      name: `Run ${Date.now()}`,
    }).then((iteration: any) => {
      iterationId = iteration.id;
    });
  });
});

// After each: Report result
afterEach(function () {
  const testName = this.currentTest?.title || "";
  const testCaseId = getTestCaseId(testName);
  if (!testCaseId || !iterationId) return;

  const status = this.currentTest?.state === "passed" ? "SUCCESS" : "FAILURE";
  cy.task("squash:report", { iterationId, testCaseId, status });
});

// After all: Finish iteration
after(() => {
  if (iterationId) cy.task("squash:finish");
});
```

---

## How to Use

### 1. Create Test Case in SquashTM

- Go to Project → Test Cases → New Test Case
- Add at least one step (required for execution)
- Note the test case ID from URL

### 2. Map in `squash-mappings.ts`

```typescript
"TC-1: gets a list of users": 2,  // 2 is the SquashTM test case ID
```

### 3. Run Tests

```bash
npx cypress run --spec "cypress/tests/api/api-users.spec.ts"
```

Results auto-appear in SquashTM under Campaign 11.

---

## Key Debugging Lessons

| Problem | Why It Happens | Fix |
|---------|---------------|-----|
| `fs is not defined` | Browser can't use Node.js `fs` | Use `cy.readFile()` or `cy.task()` |
| `Network Error` | CORS blocks browser API calls | Move calls to `cy.task()` (Node.js) |
| `Invalid type for argument` | API expects number, got string | Use `Number(campaignId)` |
| `Execution has no steps` | Test case in SquashTM has no steps | Add steps in SquashTM UI |

**Remember**: Browser context ≠ Node.js context. Use `cy.task()` to bridge.

---

## Files You Need

| File | Purpose |
|------|---------|
| `cypress/support/squash-api.js` | API client (see working code in repo) |
| `cypress/support/squash-tasks.js` | Task handlers (see working code in repo) |
| `cypress/support/squash-mappings.ts` | **You edit this** - map tests to IDs |
| `cypress/support/e2e.ts` | **You edit this** - add hooks |
| `cypress.config.ts` | **You edit this** - register tasks |
| `apitoken.txt` | **You create this** - API token |

---

## Quick Checklist

- [ ] API token in `apitoken.txt`
- [ ] Test cases created in SquashTM with steps
- [ ] Test case IDs mapped in `squash-mappings.ts`
- [ ] Campaign ID set in `e2e.ts`
- [ ] Tasks registered in `cypress.config.ts`
- [ ] Run tests with `npx cypress run`
