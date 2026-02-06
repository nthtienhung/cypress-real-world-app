# Task 9: Data-Driven Tests

**Goal:** Run same test with multiple data sets.

## What to Do

1. Create `cypress/fixtures/test-users.json` with 3 test users
2. Create `cypress/tests/ui/data-driven-login.spec.ts`
3. Write test that:
   - Reads fixture file
   - Loops through each user
   - Tests login with each

## Hints

- Use `cy.fixture()` to load JSON
- Use `forEach` or `Cypress._.each()`
- Each user should have username/password

## Run It

```bash
yarn cypress:run --spec "cypress/tests/ui/data-driven-login.spec.ts"
```

## Check Your Work

Test passes when:

- All 3 users can login
- Each iteration runs independently

---

**Move to Task 10 when done.**
