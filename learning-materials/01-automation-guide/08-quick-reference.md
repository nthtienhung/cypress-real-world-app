# Quick Reference Card

## Running Tests

```bash
# Interactive mode
yarn cypress:open

# Headless mode
yarn cypress:run

# Run specific file
yarn cypress:run --spec "cypress/tests/ui/auth.spec.ts"

# Run API tests only
yarn test:api

# Run component tests
yarn cypress:run:component

# Mobile viewport
yarn cypress:run:mobile

# With coverage
yarn cypress:run --env coverage=true
```

## Core Cypress Commands

| Command          | Example                             | Description        |
| ---------------- | ----------------------------------- | ------------------ |
| `cy.visit()`     | `cy.visit("/signin")`               | Navigate to URL    |
| `cy.get()`       | `cy.get(".button")`                 | Find element       |
| `cy.contains()`  | `cy.contains("Submit")`             | Find by text       |
| `cy.type()`      | `cy.get("input").type("text")`      | Type text          |
| `cy.click()`     | `cy.get("button").click()`          | Click element      |
| `cy.clear()`     | `cy.get("input").clear()`           | Clear input        |
| `cy.check()`     | `cy.get("input").check()`           | Check checkbox     |
| `cy.select()`    | `cy.get("select").select("option")` | Select dropdown    |
| `cy.wait()`      | `cy.wait("@alias")`                 | Wait for intercept |
| `cy.intercept()` | `cy.intercept("GET", "/api")`       | Intercept API      |
| `cy.request()`   | `cy.request("GET", url)`            | HTTP request       |
| `cy.task()`      | `cy.task("db:seed")`                | Run Node task      |

## Assertions

| Assertion   | Example                           |
| ----------- | --------------------------------- |
| be.visible  | `.should("be.visible")`           |
| exist       | `.should("exist")`                |
| not.exist   | `.should("not.exist")`            |
| have.text   | `.should("have.text", "text")`    |
| contain     | `.should("contain", "partial")`   |
| have.class  | `.should("have.class", "active")` |
| have.attr   | `.should("have.attr", "href")`    |
| have.value  | `.should("have.value", "val")`    |
| be.enabled  | `.should("be.enabled")`           |
| be.disabled | `.should("be.disabled")`          |

## Custom Commands (This Project)

| Command                   | Usage                           |
| ------------------------- | ------------------------------- |
| `cy.login()`              | `cy.login("user", "pass")`      |
| `cy.loginByApi()`         | `cy.loginByApi("user")`         |
| `cy.loginByXstate()`      | `cy.loginByXstate("user")`      |
| `cy.logoutByXstate()`     | `cy.logoutByXstate()`           |
| `cy.switchUserByXstate()` | `cy.switchUserByXstate("user")` |
| `cy.getBySel()`           | `cy.getBySel("element")`        |
| `cy.getBySelLike()`       | `cy.getBySelLike("partial")`    |
| `cy.visualSnapshot()`     | `cy.visualSnapshot("name")`     |
| `cy.database()`           | `cy.database("find", "users")`  |
| `cy.createTransaction()`  | `cy.createTransaction({...})`   |
| `cy.pickDateRange()`      | `cy.pickDateRange(start, end)`  |

## Test Structure

```typescript
describe("Feature", function () {
  // Run once before all tests
  before(function () {
    // One-time setup
  });

  // Run before each test
  beforeEach(function () {
    cy.task("db:seed");
  });

  context("Specific context", function () {
    it("should do something", function () {
      // Test code
    });
  });

  // Run after each test
  afterEach(function () {
    // Cleanup
  });

  // Run once after all tests
  after(function () {
    // Final cleanup
  });
});
```

## Intercept Patterns

```typescript
// Basic intercept
cy.intercept("GET", "/api/users").as("getUsers");

// Intercept and mock response
cy.intercept("GET", "/api/users", {
  statusCode: 200,
  body: { users: [] },
}).as("getUsers");

// Intercept with function
cy.intercept("POST", "/login", (req) => {
  req.reply({ user: { id: "123" } });
}).as("login");

// Wait for intercept
cy.wait("@getUsers");

// Wait with assertion
cy.wait("@login").its("response.statusCode").should("eq", 200);
```

## API Testing

```typescript
// GET request
cy.request("GET", url).then((res) => {
  expect(res.status).to.eq(200);
});

// POST request
cy.request("POST", url, body).then((res) => {
  expect(res.body).to.have.property("id");
});

// With options
cy.request({
  method: "POST",
  url: apiUrl,
  body: { name: "John" },
  failOnStatusCode: false,
});
```

## Database Tasks

```typescript
// Seed database
cy.task("db:seed");

// Find one record
cy.database("find", "users", { id: "123" }).then((user) => {
  // user is single object
});

// Filter records
cy.database("filter", "users", { balance: 100 }).then((users) => {
  // users is array
});

// Get all
cy.database("filter", "users").then((allUsers) => {
  // all users
});
```

## TypeScript Types

```typescript
// Import app types
import { User, Transaction } from "../src/models";

// Define test context
type TestCtx = {
  user?: User;
  transaction?: Transaction;
};

// Use in test
const ctx: TestCtx = {};
```

## Mobile Testing

```typescript
import { isMobile } from "../../support/utils";

// Check if mobile viewport
if (isMobile()) {
  cy.getBySel("sidenav-toggle").click();
}

// Set viewport
cy.viewport(375, 667); // iPhone
cy.viewport(1280, 720); // Desktop
cy.viewport("macbook-15"); // Named preset
```

## Environment Variables

```typescript
// Access in tests
Cypress.env("apiUrl");
Cypress.env("defaultPassword");

// From cypress.config.ts
env: {
  apiUrl: "http://localhost:3001",
  defaultPassword: "s3cret",
}
```

## File Locations

| Type            | Location            | Pattern             |
| --------------- | ------------------- | ------------------- |
| E2E Tests       | cypress/tests/ui/   | \*.spec.ts          |
| API Tests       | cypress/tests/api/  | api-\*.spec.ts      |
| Component Tests | src/                | \*.cy.tsx           |
| Support         | cypress/support/    | commands.ts, e2e.ts |
| Fixtures        | cypress/fixtures/   | \*.json             |
| Config          | cypress.config.ts   | Main config         |
| Types           | cypress/global.d.ts | Type declarations   |

## Configuration Key Settings

```typescript
{
  projectId: "your-project-id",
  baseUrl: "http://localhost:3000",
  viewportWidth: 1280,
  viewportHeight: 1000,
  specPattern: "cypress/tests/**/*.spec.ts",
  retries: { runMode: 2 },
  env: {
    apiUrl: "http://localhost:3001",
    defaultPassword: "s3cret",
  },
}
```

## Common npm Scripts

| Script                       | Description              |
| ---------------------------- | ------------------------ |
| `yarn cypress:open`          | Open Cypress GUI         |
| `yarn cypress:run`           | Run tests headlessly     |
| `yarn test:api`              | Run API tests            |
| `yarn cypress:run:component` | Run component tests      |
| `yarn cypress:run:mobile`    | Run with mobile viewport |
| `yarn dev`                   | Start dev server         |
| `yarn db:seed`               | Reset database           |

## Troubleshooting

| Issue                | Solution                                    |
| -------------------- | ------------------------------------------- |
| Test flaky           | Add intercepts and waits                    |
| Element not found    | Check data-test attribute                   |
| Test too slow        | Use API login instead of UI                 |
| TypeScript errors    | Add types to global.d.ts                    |
| Database state wrong | Ensure db:seed in beforeEach                |
| Mobile test fails    | Check isMobile() conditional                |
| Timeout              | Increase timeout or check for loading state |

## Resources

- **Cypress Docs**: https://docs.cypress.io
- **Cypress API**: https://docs.cypress.io/api/table-of-contents
- **TypeScript**: https://www.typescriptlang.org/docs
- **Best Practices**: https://docs.cypress.io/guides/references/best-practices
