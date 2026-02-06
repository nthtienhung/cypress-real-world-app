# Best Practices & Patterns

## Summary of Testing Best Practices from the Cypress Real World App

## 1. Test Isolation

Every test should be independent and reset state between runs.

```typescript
beforeEach(function () {
  cy.task("db:seed"); // Reset database
});
```

**Why:** Prevents tests from affecting each other. A failing test doesn't cascade to others.

## 2. Use Custom Commands

Extract reusable actions into custom commands.

```typescript
// Instead of repeating:
cy.visit("/signin");
cy.get("[data-test=username]").type("john");
cy.get("[data-test=password]").type("secret");
cy.get("[data-test=submit]").click();

// Use:
cy.login("john", "secret");
```

**Why:**

- Reduces code duplication
- Makes tests more readable
- Centralizes maintenance

## 3. Data-Test Attributes for Selectors

Use `data-test` attributes instead of CSS classes or IDs.

```html
<!-- HTML -->
<button data-test="submit-button" class="btn btn-primary">Submit</button>
```

```typescript
// Test
cy.getBySel("submit-button").click();
```

**Why:**

- Resilient to CSS changes
- Clear intent ("this is for testing")
- Won't break when styles change

## 4. Intercept and Wait for API Calls

Always wait for async operations.

```typescript
cy.intercept("POST", "/login").as("loginUser");
cy.get("button").click();
cy.wait("@loginUser");
// Now safe to assert
```

**Why:**

- Prevents flaky tests
- Ensures operations complete before asserting
- Allows asserting on API responses

## 5. Use TypeScript

Add types to catch errors early.

```typescript
// In global.d.ts
interface Chainable {
  login(username: string, password: string): void;
}

// TypeScript catches this:
cy.login("john", 123); // Error: number not assignable to string
```

## 6. Handle Responsive Design

Test both mobile and desktop viewports.

```typescript
import { isMobile } from "../../support/utils";

if (isMobile()) {
  cy.getBySel("sidenav-toggle").click();
}
```

**Viewport testing:**

```typescript
cy.viewport(1280, 720); // Desktop
cy.viewport(375, 667); // Mobile (iPhone)
cy.viewport("macbook-15"); // Named viewport
```

## 7. Visual Regression Testing

Take snapshots at key points.

```typescript
cy.visualSnapshot("After Login");
cy.visualSnapshot("Transaction Complete");
```

**Why:** Catches unintended visual changes.

## 8. Test Both Success and Failure Cases

```typescript
it("logs in successfully", () => {
  /* ... */
});
it("shows error for invalid credentials", () => {
  /* ... */
});
it("disables submit when form invalid", () => {
  /* ... */
});
```

## 9. Use Fixtures for Test Data

```typescript
// cypress/fixtures/users.json
{ "users": [{ "id": "1", "name": "John" }] }

// In test
cy.intercept("/api/users", { fixture: "users.json" });
```

## 10. Parameterize Tests

Test multiple scenarios with same logic.

```typescript
["firstName", "lastName", "email"].forEach((attr) => {
  it(`searches by ${attr}`, () => {
    cy.get("input").type(user[attr]);
    // ...
  });
});
```

## 11. Database Assertions

Verify backend state, not just UI.

```typescript
// After creating transaction
cy.database("find", "users", { id: userId }).its("balance").should("equal", expectedBalance);
```

## 12. Avoid Hardcoded Values

Use environment variables or database queries.

```typescript
// Bad
cy.login("john_doe", "s3cret");

// Good
cy.database("find", "users").then((user: User) => {
  cy.login(user.username, Cypress.env("defaultPassword"));
});
```

## 13. Use before() for One-Time Setup

```typescript
before(() => {
  // Warm-up request to avoid cold start timing issues
  cy.request("GET", "/");
});

beforeEach(() => {
  // Reset for every test
  cy.task("db:seed");
});
```

## 14. Organize Tests with Context

```typescript
describe("Users API", () => {
  context("GET /users", () => {
    // All GET tests
  });

  context("POST /users", () => {
    // All POST tests
  });
});
```

## 15. Use Aliases for Shared Data

```typescript
cy.database("find", "users").as("currentUser");

// Later
cy.get("@currentUser").then((user) => {
  cy.login(user.username, user.password);
});
```

## 16. Assert on API Responses

```typescript
cy.wait("@createTransaction").then((interception) => {
  expect(interception.response.statusCode).to.eq(200);
  expect(interception.response.body).to.have.property("id");
});
```

## 17. Clean Up in afterEach (if needed)

```typescript
afterEach(() => {
  // Clean up any created resources
  cy.task("cleanupTestData");
});
```

## 18. Use Custom Log Messages

```typescript
Cypress.Commands.add("login", (username) => {
  const log = Cypress.log({
    name: "login",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${username}`],
  });
  // ...
});
```

## 19. Test State Machine Integration

When the app uses XState, bypass UI for faster tests.

```typescript
cy.window().then((win) => {
  win.authService.send("LOGIN", { username, password });
});
```

## 20. Run Tests in CI

```bash
# Run all tests
yarn cypress:run

# Run specific tests
yarn cypress:run --spec "cypress/tests/ui/*.spec.ts"

# Run with coverage
yarn cypress:run --env coverage=true
```

## Common Anti-Patterns to Avoid

### ❌ Don't Use cy.wait() with Arbitrary Time

```typescript
// Bad - Flaky!
cy.wait(2000); // Wait 2 seconds

// Good - Wait for specific condition
cy.get(".loading").should("not.exist");
// Or
cy.wait("@apiCall");
```

### ❌ Don't Chain Assertions Off Commands That Don't Yield

```typescript
// Bad
cy.click().should("be.visible"); // click() doesn't yield element

// Good
cy.get("button").click();
cy.get("button").should("be.disabled");
```

### ❌ Don't Test Implementation Details

```typescript
// Bad - Testing internal state
cy.window().its("appState.loading").should("be.false");

// Good - Testing what user sees
cy.get(".spinner").should("not.exist");
```

### ❌ Don't Skip the Support File

```typescript
// In cypress/support/e2e.ts
beforeEach(() => {
  // Always reset state here
  cy.task("db:seed");
});
```

## Testing Pyramid

```
    /\
   /  \     E2E Tests (Few)
  /----\
 /      \   Integration Tests
/--------\
/          \ Unit Tests (Many)
/------------\
```

- **Unit Tests**: Fast, isolated, many
- **Integration/API Tests**: Medium speed, test backend
- **E2E Tests**: Slow, test complete flows, fewer

## File Organization

```
cypress/
├── tests/
│   ├── api/        # API tests
│   ├── ui/         # E2E tests
│   └── demo/       # Demo tests
├── support/
│   ├── commands.ts # Custom commands
│   ├── e2e.ts      # E2E setup
│   └── utils.ts    # Utilities
├── fixtures/       # Test data
└── global.d.ts     # Type definitions
```

## Remember

1. **Tests should be deterministic** - Same input always produces same output
2. **Tests should be independent** - No test depends on another
3. **Tests should be fast** - Use API over UI when possible
4. **Tests should be readable** - Clear descriptions and organization
5. **Tests should be maintainable** - Use custom commands and good selectors
