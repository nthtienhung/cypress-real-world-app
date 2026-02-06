# Task 5: Page Object Pattern

**Goal:** Refactor login tests using Page Object Model.

## What to Do

1. Create `cypress/pages/LoginPage.ts`
2. Create page object with:
   - `visit()` method
   - `login(username, password)` method
   - `getError()` method
3. Refactor existing login test to use page object

## Hints

- Page object is a class with methods
- Methods wrap Cypress commands
- Makes tests more readable

## Example Structure

```typescript
class LoginPage {
  visit() {
    cy.visit("/signin");
  }

  login(user, pass) {
    // fill form and submit
  }
}
```

## Check Your Work

Refactored test should look like:

```typescript
const loginPage = new LoginPage();
loginPage.visit();
loginPage.login("user", "pass");
```

---

**Move to Task 6 when done.**
