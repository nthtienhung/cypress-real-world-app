# SquashTM Integration - Practice Exercises

---

## Fix Exercises

### 1. Race Condition in `after()`

**Problem**: Cypress might exit before `squash:finish` completes.

```typescript
after(() => {
  if (iterationId) {
    cy.task("squash:finish");  // ← Not awaited!
  }
});
```

**Task**: Fix it using the pattern from `before()`.

<details>
<summary>Hint</summary>
Use `.then()` to ensure the command completes.
</details>

---

### 2. Error Handling

**Problem**: If reporting fails, test still passes silently.

```typescript
cy.task("squash:report", { iterationId, testCaseId, status });
// No error handling!
```

**Task**:
- Check the result returned from the task
- Log a warning if it fails
- Decide: should the test fail if SquashTM is down?

---

### 3. Remove Hardcoded Credentials

**Problem**: Username/password in `e2e.ts`:

```typescript
username: "hung.nguyen",
password: "bannerman123",
```

**Task**:
- Move to `.env` file
- Use `Cypress.env()` to read
- Add `.env` to `.gitignore`

---

## Understanding Exercises

### 4. Prove CORS Exists

Create `cypress/tests/cors-test.spec.ts`:

```typescript
it("shows CORS error", () => {
  cy.request({
    url: "https://squash-tm-dev-01.l0tt0.online/squash/api/rest/latest/campaigns",
    headers: { "Authorization": "Bearer YOUR_TOKEN" },
    failOnStatusCode: false
  }).then((res) => {
    cy.log("Status:", res.status);
    cy.log("CORS error should appear here");
  });
});
```

**Questions**:
- What error do you see?
- Why does `cy.task()` work but `cy.request()` fails?

---

### 5. Trace Authentication

Add logging to `squash-api.js`:

```javascript
async login() {
  // Log XSRF token
  console.log("XSRF:", this.xsrfToken?.substring(0, 10) + "...");
  // Log session cookie
  console.log("Session:", this.sessionCookie?.substring(0, 10) + "...");
}
```

**Experiment**: Comment out XSRF header → What error?

**Questions**:
- What attack does XSRF prevent?
- Why do we need both cookie AND Bearer token?

---

### 6. Map the Data Model

Run this exploration script:

```javascript
// scripts/explore-squash.js
const { SquashAPI } = require('../cypress/support/squash-api');
const fs = require('fs');

async function explore() {
  const api = new SquashAPI({
    baseUrl: 'https://squash-tm-dev-01.l0tt0.online',
    apiToken: fs.readFileSync('./apitoken.txt', 'utf8').trim()
  });

  await api.login();

  // Create iteration
  const iteration = await api.createIteration(11, 'Test');
  console.log("Iteration ID:", iteration.id);

  // Add test case
  await api.addTestCaseToIteration(iteration.id, 2);

  // Get test plan
  const plan = await api.getIterationTestPlan(iteration.id);
  console.log("Test plan item ID:", plan._embedded['test-plan'][0].id);

  // Create execution
  const exec = await api.createExecution(plan._embedded['test-plan'][0].id);
  console.log("Execution ID:", exec.id);
}

explore();
```

**Draw the hierarchy**:
```
Campaign (11)
  └── Iteration (?)
        └── Test Plan Item (?)
              └── Execution (?)
```

---

### 7. Test Failure Reporting

Create `cypress/tests/failure-test.spec.ts`:

```typescript
describe("Failure Test", () => {
  it("TC-FAIL: intentional failure", () => {
    expect(true).to.be.false;
  });

  it("TC-PASS: passes", () => {
    expect(true).to.be.true;
  });
});
```

Add mappings and run. Check SquashTM:
- What status does the failed test get?
- What about the passed test?

---

## Advanced

### 8. Multiple Spec Files

**Problem**: Current setup creates one iteration per spec file.

**Task**: Make one iteration cover ALL specs.

**Hint**: Look at `cypress.config.ts` → `on('before:run')` and `on('after:run')`

---

### 9. Auto-Map Test Names

Instead of manual mapping, match by name:

```typescript
// Before run, fetch all test cases from SquashTM
// GET /test-cases?projectId=11
// Match Cypress "gets a user" ↔ SquashTM "gets a user"
// Warn if no match
```

---

### 10. Screenshot Upload

**Task**: Upload failure screenshots to SquashTM execution.

**Research**:
- Does SquashTM API support attachments on executions?
- How to read screenshot files in Node.js?

---

## Progress Tracker

| Exercise | Status | Notes |
|----------|--------|-------|
| 1: Race Condition | ☐ | |
| 2: Error Handling | ☐ | |
| 3: Credentials | ☐ | |
| 4: CORS | ☐ | |
| 5: Authentication | ☐ | |
| 6: Data Model | ☐ | |
| 7: Failure Testing | ☐ | |
| 8: Multi-Spec | ☐ | |
| 9: Auto-Map | ☐ | |
| 10: Screenshots | ☐ | |
