# Task 4: Intercept & Mock

**Goal:** Mock a slow API response and test loading states.

## What to Do

1. Create `cypress/tests/ui/loading-state.spec.ts`
2. Write a test that:
   - Intercepts GET /transactions
   - Delays response by 2 seconds
   - Verifies loading spinner appears
   - Verifies transactions appear after delay

## Hints

- Use `cy.intercept()` with `{ delay: 2000 }`
- Loading indicator has `data-test="loading-indicator"` or similar
- Use `cy.wait()` to wait for intercept alias

## Run It

```bash
yarn cypress:run --spec "cypress/tests/ui/loading-state.spec.ts"
```

## Check Your Work

Test passes when:

- Loading state visible during delay
- Transactions render after response

---

**Move to Task 5 when done.**
