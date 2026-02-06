# Task 1: Your First Test

**Goal:** Write a test that verifies the login page shows an error for invalid credentials.

## What to Do

1. Create `cypress/tests/ui/login-error.spec.ts`
2. Write a test that:
   - Visits the login page (`/signin`)
   - Types wrong username/password
   - Clicks login
   - Asserts error message appears

## Hints

- Use `cy.visit('/signin')`
- Use `cy.getBySel()` to find elements (check `commands.ts` for available custom commands)
- Error message has `data-test="signin-error"`

## Run It

```bash
yarn cypress:run --spec "cypress/tests/ui/login-error.spec.ts"
```

## Check Your Work

The test should pass when:

- Error message "Username or password is invalid" is visible
- Login button is still on the page

---

**Move to Task 2 when done.**
