# SquashTM Integration - Practice Exercises

Complete these exercises to fully understand the integration.

---

## Part 1: Fix the Code

### Exercise 1: Race Condition in `after()`

**Problem**: The `after()` hook runs but doesn't wait for `squash:finish` to complete.

```typescript
after(() => {
  if (iterationId) {
    cy.task("squash:finish");  // Cypress might exit before this finishes
  }
});
```

**Your Task**:
- Research how Cypress handles async in hooks
- Fix the code so it waits for the API call to complete
- Verify by adding a console.log after the finish call

**Hint**: Cypress commands return promises/chains. Look at the `before()` hook for the pattern.

---

### Exercise 2: Error Handling

**Problem**: If reporting fails, the test still passes.

```typescript
afterEach(function () {
  const testName = this.currentTest?.title || "";
  const testCaseId = getTestCaseId(testName);
  if (!testCaseId || !iterationId) return;

  const status = this.currentTest?.state === "passed" ? "SUCCESS" : "FAILURE";
  cy.task("squash:report", { iterationId, testCaseId, status });
  // What if this fails? Test still passes!
});
```

**Your Task**:
- Make the task return a result: `{ success: true/false, error?: string }`
- Check the result and log a warning if it fails
- Decide: should the test fail if reporting fails? Implement your decision.

**Questions**:
- Should a test fail if SquashTM is down?
- Should a test fail if the mapping is wrong?
- When is it okay to silently fail?

---

### Exercise 3: Handle Missing Steps

**Problem**: If a test case has no steps, execution creation fails silently.

**Your Task**:
- Find where we handle the "Execution has no steps" error
- Add proper logging so the user knows what to fix
- Consider: should we auto-create steps? Why or why not?

**Hint**: Look in `squash-api.js` in the `createExecution` method.

---

### Exercise 4: Remove Hardcoded Credentials

**Problem**: Username/password are hardcoded in `e2e.ts`.

**Your Task**:
- Move credentials to environment variables
- Update the code to use `Cypress.env()` or `process.env`
- Create a `.env.example` file showing what variables are needed
- Add `.env` to `.gitignore`

**Questions**:
- What's the risk of committing credentials?
- How would you handle this in CI/CD?

---

## Part 2: Understanding Exercises

### Exercise 5: Prove CORS Exists

**Background**: We use `cy.task()` because browser API calls fail due to CORS.

**Your Task**:
Create a test file `cypress/tests/cors-test.spec.ts`:

```typescript
it("should fail due to CORS", () => {
  // Try to call SquashTM API directly from browser
  cy.request({
    method: "GET",
    url: "https://squash-tm-dev-01.l0tt0.online/squash/api/rest/latest/campaigns",
    headers: {
      "Authorization": "Bearer YOUR_TOKEN_HERE"
    },
    failOnStatusCode: false
  }).then((response) => {
    cy.log("Status:", response.status);
    cy.log("Body:", JSON.stringify(response.body));
  });
});
```

Run it. What error do you get? Open DevTools Network tab and look at:
- The preflight OPTIONS request
- The CORS headers (or lack thereof)
- The exact error message

**Questions**:
1. What is CORS protecting against?
2. Why does the browser enforce CORS but Node.js doesn't?
3. What would happen if browsers didn't have CORS?

---

### Exercise 6: Trace Authentication

**Background**: Authentication has 3 steps with 3 different tokens.

**Your Task**:
Add logging to `squash-api.js` in the `login()` method:

```javascript
async login() {
  // After getting XSRF token
  console.log("Step 1: XSRF token =", this.xsrfToken?.substring(0, 10) + "...");

  // After login
  console.log("Step 2: JSESSIONID =", this.sessionCookie?.substring(0, 10) + "...");

  // In getAuthHeaders or API calls
  console.log("Step 3: Bearer token =", this.apiToken?.substring(0, 10) + "...");
}
```

Run a test and watch the logs.

**Experiments**:
1. Comment out the XSRF token in login POST. What error?
2. Comment out the JSESSIONID in API calls. What error?
3. Use wrong Bearer token. What error?

**Questions**:
- Why do we need BOTH session cookie AND Bearer token?
- What attack does XSRF token prevent?
- Why can't we just use username/password for every API call?

---

### Exercise 7: Map SquashTM Data Model

**Background**: SquashTM has nested resources.

**Your Task**:
Create a script to explore the hierarchy:

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

  // 1. Create iteration
  const iteration = await api.createIteration(11, 'Explore Test');
  console.log("Iteration:", iteration);

  // 2. Add test case
  await api.addTestCaseToIteration(iteration.id, 2);
  console.log("Added test case 2");

  // 3. Get test plan
  const testPlan = await api.getIterationTestPlan(iteration.id);
  console.log("Test plan structure:", JSON.stringify(testPlan, null, 2));

  // 4. Create execution
  const tpItem = testPlan._embedded['test-plan'][0];
  console.log("Test plan item ID:", tpItem.id);

  const execution = await api.createExecution(tpItem.id);
  console.log("Execution:", execution);
}

explore();
```

Run: `node scripts/explore-squash.js`

**Draw the hierarchy**:
```
Campaign (ID: 11)
  └── Iteration (ID: ?)
        └── Test Plan Item (ID: ?)
              ├── references Test Case (ID: 2)
              └── has Executions (ID: ?)
```

**Questions**:
- Why can't we create an execution directly from a test case ID?
- What's the purpose of the test plan item?
- What happens if you add the same test case twice?

---

### Exercise 8: Test Failure Reporting

**Background**: We need to verify FAILURE status works.

**Your Task**:
Create a test file `cypress/tests/failure-test.spec.ts`:

```typescript
describe("Failure Test", () => {
  it("TC-FAIL: this test should fail", () => {
    // Map this in squash-mappings.ts first!
    expect(true).to.be.false;
  });

  it("TC-ERROR: this test throws error", () => {
    throw new Error("Intentional error");
  });

  it("TC-PASS: this test passes", () => {
    expect(true).to.be.true;
  });
});
```

Add mappings:
```typescript
"TC-FAIL: this test should fail": 999,  // Use a real test case ID
"TC-ERROR: this test throws error": 998,
"TC-PASS: this test passes": 997,
```

Run and check SquashTM:
- What status does each get?
- Is there a difference between assertion failure and thrown error?

---

### Exercise 9: Handle Multiple Spec Files

**Problem**: Current setup creates one iteration per spec file.

**Your Task**:
Research and implement a solution where one iteration covers ALL specs.

**Hints**:
- Look at `cypress.config.ts` setupNodeEvents
- Research `on('before:run')` and `on('after:run')` events
- Consider using a global variable or file to share iteration ID

**Questions**:
- What are the pros/cons of one iteration vs many?
- How would you handle parallel test execution?

---

### Exercise 10: Async/Await vs Promises

**Background**: The code mixes styles.

**Your Task**:
Refactor `e2e.ts` to use ONLY ONE style:

Option A - All Promises:
```typescript
before(() => {
  cy.readFile("apitoken.txt")
    .then((token) => cy.task("squash:init", { ... }))
    .then(() => cy.task("squash:createIteration", { ... }))
    .then((iteration) => { iterationId = iteration.id; });
});
```

Option B - All Async/Await (harder with Cypress):
Research if/how Cypress supports async/await in hooks.

**Questions**:
- Why does mixing styles cause confusion?
- When is one style better than the other?
- Why is async/await tricky with Cypress?

---

## Part 3: Deep Dive Questions

### Question 1: Type Safety

The API expects `campaignId` as number but JavaScript is loosely typed.

**Experiment**:
```javascript
console.log(typeof "11");     // string
console.log(typeof 11);       // number
console.log("11" === 11);     // false
console.log("11" == 11);      // true
```

**Questions**:
- Why does SquashTM validate types strictly?
- What other types could cause issues? (dates, booleans, null)
- How would TypeScript help here?

---

### Question 2: Global State

We store `iterationId` in a module-level variable.

**Problems**:
- What if tests run in parallel?
- What if you run 5 spec files - how many iterations?
- What happens if a test fails in `before()` - is `iterationId` set?

**Your Task**:
Design a state management solution. Consider:
- Environment variables
- File-based storage
- Cypress.env()
- A singleton class

---

### Question 3: Error Recovery Design

Design a decision tree for errors:

```
Test completes
    │
    ├── Mapping found?
    │       ├── No → Log warning, continue
    │       └── Yes → Report to SquashTM
    │               │
    │               ├── Success? → Done
    │               └── Fail?
    │                       ├── Network error → Retry 3x
    │                       ├── 401 Unauthorized → Stop all
    │                       ├── Test case not found → Log error
    │                       └── Server error → ?
```

**Your Task**: Complete the tree. Implement the retry logic.

---

### Question 4: Security Analysis

**Scenario**: You accidentally commit `apitoken.txt` to GitHub.

**Questions**:
1. Who can see the token?
2. What can they do with it?
3. How do you revoke it?
4. How do you prevent this? (pre-commit hooks, etc)

**Research**: Look up `.gitignore`, `git-secrets`, GitHub secret scanning.

---

## Part 4: Architecture Challenge

### Challenge: Async Reporting Queue

**Current Problem**: Reporting blocks the next test.

```
Test 1 runs (2s) → Report (1s) → Test 2 runs (2s) → Report (1s)
Total: 6s
```

**Proposed Solution**: Queue system

```
Test 1 runs (2s) → Add to queue (instant) → Test 2 runs (2s) → Add to queue
                                    ↓
                            Background worker sends reports
```

**Your Task**:
Design this system. Consider:
- Where is the queue stored? (memory, file, array)
- How does the worker run in background?
- How do you ensure all reports finish before Cypress exits?
- What if a report fails? Retry or drop?

**Hint**: Look at `cypress.config.ts` events - can you start a background process?

---

## Part 5: Advanced Exercises

### Exercise 11: Validate Before Reporting

Add a check that the test case exists in SquashTM before trying to add it.

API endpoint: `GET /test-cases/{id}`

**Benefits**:
- Fail fast with clear error
- Don't create partial iterations
- Validate mappings on startup

---

### Exercise 12: Auto-Create Mappings

Instead of manual mapping, auto-map by test name:

1. Before run, fetch all test cases from SquashTM
2. Match by name: Cypress "gets a user" ↔ SquashTM "gets a user"
3. Warn if no match found
4. Generate the mappings file

**API**: `GET /test-cases?projectId=11`

---

### Exercise 13: Screenshot Upload

Cypress captures screenshots on failure. Upload them to SquashTM execution.

**Research**:
- Does SquashTM API support attachments?
- How to read screenshot files in Cypress?
- When to upload (afterEach vs after)

---

### Exercise 14: Dry Run Mode

Add a `SQUASH_DRY_RUN` environment variable.

When true:
- Log what WOULD be reported
- Don't actually call API
- Useful for testing the integration

---

## Progress Tracker

| Exercise | Status | Date | Notes |
|----------|--------|------|-------|
| 1: Race Condition | ☐ | | |
| 2: Error Handling | ☐ | | |
| 3: Missing Steps | ☐ | | |
| 4: Credentials | ☐ | | |
| 5: CORS | ☐ | | |
| 6: Authentication | ☐ | | |
| 7: Data Model | ☐ | | |
| 8: Failure Testing | ☐ | | |
| 9: Multi-Spec | ☐ | | |
| 10: Async Styles | ☐ | | |
| 11: Validation | ☐ | | |
| 12: Auto-Mapping | ☐ | | |
| 13: Screenshots | ☐ | | |
| 14: Dry Run | ☐ | | |

---

## How to Approach

1. **Start with Exercise 6** (trace authentication) - fundamental understanding
2. **Then Exercise 7** (data model) - understand the hierarchy
3. **Fix Exercises 1-4** - make the code production-ready
4. **Pick advanced exercises** based on your needs

---

## Getting Help

When stuck:
1. Add `console.log()` everywhere
2. Run with `DEBUG=cypress:* npx cypress run` (very verbose)
3. Check Network tab in DevTools (for browser issues)
4. Check terminal output (for Node.js/task issues)
5. Read the actual error message carefully - it tells you file and line

---

**Remember**: The goal is understanding, not just making it work.
