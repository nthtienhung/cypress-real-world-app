# Practice Exercises

## Fix Exercises

### 1. Race Condition in `after()`

**Problem**: Cypress exits before `squash:finish` completes.

```typescript
after(() => {
  cy.task("squash:finish");  // ← Not awaited
});
```

**Task**: Fix it using `.then()` like in `before()`.

---

### 2. Error Handling

**Problem**: Reporting fails silently.

```typescript
cy.task("squash:report", { iterationId, testCaseId, status });
// No error handling
```

**Task**: Check result, log warning on failure.

---

### 3. Remove Hardcoded Credentials

Move credentials to `.env` file instead of hardcoded in `e2e.ts`.

---

## Understanding Exercises

### 4. Prove CORS Exists

```typescript
it("shows CORS error", () => {
  cy.request({
    url: "https://squash-tm-dev-01.l0tt0.online/squash/api/rest/latest/campaigns",
    headers: { "Authorization": "Bearer YOUR_TOKEN" },
    failOnStatusCode: false
  });
});
```

**Question**: Why does `cy.task()` work but `cy.request()` fails?

---

### 5. Map the Data Model

Create script to explore hierarchy:

```javascript
const api = new SquashAPI({ ... });
await api.login();
const iteration = await api.createIteration(11, 'Test');
await api.addTestCaseToIteration(iteration.id, 2);
const plan = await api.getIterationTestPlan(iteration.id);
const exec = await api.createExecution(plan._embedded['test-plan'][0].id);
```

**Draw**: Campaign → Iteration → Test Plan Item → Execution

---

### 6. Test Failure Reporting

Create test that intentionally fails. Check SquashTM for FAILURE status.

---

## Advanced

### 7. Multiple Spec Files

Make one iteration cover ALL spec files (not one per file).

**Hint**: `cypress.config.ts` → `on('before:run')` and `on('after:run')`

---

### 8. Auto-Map Test Names

Match by name instead of manual mapping.

```typescript
// GET /test-cases?projectId=11
// Match Cypress "gets user" ↔ SquashTM "gets user"
```

---

## Progress Tracker

| Exercise | Status | Notes |
|----------|--------|-------|
| 1: Race Condition | ☐ | |
| 2: Error Handling | ☐ | |
| 3: Credentials | ☐ | |
| 4: CORS | ☐ | |
| 5: Data Model | ☐ | |
| 6: Failures | ☐ | |
| 7: Multi-Spec | ☐ | |
| 8: Auto-Map | ☐ | |
