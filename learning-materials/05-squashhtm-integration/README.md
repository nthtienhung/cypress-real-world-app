# SquashTM Integration

Auto-report Cypress test results to SquashTM test management tool.

---

## What is SquashTM?

Test management system for storing test cases, planning campaigns, and tracking execution history.

```
Project
 └── Campaign (e.g., "Sprint 12 Testing")
      └── Iteration (e.g., "Run 2024-02-15")
           └── Test Plan Items
                └── Executions (SUCCESS/FAILURE/BLOCKED)
```

---

## How Integration Works

```
┌─────────────┐     cy.task()      ┌─────────────┐     HTTP API     ┌─────────────┐
│   Cypress   │ ───────────────────▶│   Node.js   │ ───────────────────▶│  SquashTM   │
│  (Browser)  │                    │   (Tasks)   │                    │   (Server)  │
└─────────────┘                    └─────────────┘                    └─────────────┘
```

**Why cy.task()?** Browser can't call external APIs (CORS) or access filesystem.

---

## The 4 Key Files

| File | Purpose |
|------|---------|
| `cypress/support/squash-api.js` | SquashTM REST API client |
| `cypress/support/squash-tasks.js` | Node.js functions called by `cy.task()` |
| `cypress/support/squash-mappings.ts` | Map test names → SquashTM test case IDs |
| `cypress/support/e2e.ts` | Cypress hooks (before/afterEach/after) |
| `cypress.config.ts` | Register tasks |

---

## Data Flow

```
1. before()          → cy.task("squash:init")          → Login to SquashTM
                       cy.task("squash:createIteration") → Create iteration

2. afterEach()       → cy.task("squash:report")         → Add test case → Create execution → Set status

3. after()           → cy.task("squash:finish")         → Mark iteration FINISHED
```

---

## API Call Sequence (Per Test)

```
1. GET /login                               → Get XSRF token + session cookie
2. POST /campaigns/{id}/iterations          → Create iteration
3. POST /iterations/{id}/test-plan          → Add test case to iteration
4. POST /test-plan-items/{id}/executions    → Create execution
5. PATCH /executions/{id}                   → Set status (SUCCESS/FAILURE)
6. PATCH /iterations/{id}                   → Mark FINISHED
```

---

## Configuration

**File**: `cypress/support/e2e.ts`

```typescript
const CAMPAIGN_ID = 11;  // ← Your campaign ID in SquashTM

before(() => {
  cy.task("squash:init", {
    baseUrl: "https://squash-tm-dev-01.l0tt0.online",
    username: "hung.nguyen",
    password: "bannerman123",
    apiToken: /* from apitoken.txt */
  });
});
```

**To change**: Update `CAMPAIGN_ID`, `baseUrl`, `username`, `password`

---

## Test Mappings

**File**: `cypress/support/squash-mappings.ts`

```typescript
export const testCaseMappings: Record<string, number> = {
  "TC-1: gets a list of users": 316,  // test name → SquashTM test case ID
  // Add more mappings here...
};
```

**How to find test case ID**: Open test case in SquashTM → URL shows `/test-case/123/info` → ID is `123`

---

## Current Status

| Setting | Value |
|---------|-------|
| Campaign ID | `11` |
| Mapped Tests | 1 (`TC-1: gets a list of users` → `316`) |
| API Token | Read from `apitoken.txt` |

---

## Quick Start

1. **Create test case in SquashTM** (must have at least 1 step)
2. **Add mapping** to `squash-mappings.ts`
3. **Run tests**: `npx cypress run --spec "cypress/tests/api/*.spec.ts"`
4. **Check SquashTM**: Campaign → Iterations → Latest run

---

## Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `Execution has no steps` | Test case in SquashTM has no steps | Add steps in SquashTM UI |
| `Network Error` | CORS blocking | Use `cy.task()`, not `cy.request()` |
| `Invalid type` | API expects number, got string | Use `Number(campaignId)` |

---

## Next Steps

→ [Practice Exercises](03-practice-exercises.md)
