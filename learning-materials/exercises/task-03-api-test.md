# Task 3: API Test for User Creation

**Goal:** Test the user signup endpoint directly.

## What to Do

1. Create `cypress/tests/api/signup.spec.ts`
2. Write a test that:
   - Sends POST to `/users` with new user data
   - Verifies 201 status code
   - Checks user exists in database

## Hints

- Use `cy.request()` method
- Endpoint: `POST ${Cypress.env("apiUrl")}/users`
- Body needs: firstName, lastName, username, password, confirmPassword

## Run It

```bash
yarn cypress:run --spec "cypress/tests/api/signup.spec.ts"
```

## Check Your Work

Test passes when:

- Response status is 201
- Response body contains user id
- User appears in database

---

**Move to Task 4 when done.**
