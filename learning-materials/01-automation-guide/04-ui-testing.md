# UI Testing Guide

## File Pattern: `cypress/tests/ui/*.spec.ts`

UI tests simulate real user interactions in the browser. They are **comprehensive** but **slower** than API tests.

## Basic Structure

```typescript
import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

describe("User Authentication", function () {
  beforeEach(function () {
    cy.task("db:seed"); // Reset database
    cy.intercept("POST", "/login").as("loginUser"); // Intercept API
  });

  it("should login successfully", function () {
    cy.visit("/signin");
    cy.getBySel("signin-username").type("john_doe");
    cy.getBySel("signin-password").type("s3cret");
    cy.getBySel("signin-submit").click();
    cy.wait("@loginUser");
    cy.location("pathname").should("equal", "/");
  });
});
```

## Key Concepts

### 1. `cy.visit()` - Navigate to Pages

```typescript
cy.visit("/signin"); // Relative to baseUrl
cy.visit("http://localhost:3000/signin"); // Full URL
```

### 2. Element Selection

**Using custom commands (recommended):**

```typescript
cy.getBySel("signin-username"); // [data-test=signin-username]
cy.getBySelLike("transaction-item"); // [data-test*=transaction-item]
```

**Using standard Cypress selectors:**

```typescript
cy.get("button"); // By tag
cy.get(".class-name"); // By class
cy.get("#id-name"); // By ID
cy.get('[data-test="username"]'); // By attribute
cy.contains("Sign In"); // By text content
cy.contains("button", "Submit"); // By tag and text
```

### 3. Actions

```typescript
// Typing
cy.get("input").type("Hello World");
cy.get("input").type("Hello{enter}"); // With special keys
cy.get("input").clear(); // Clear input
cy.get("input").type("{selectall}{backspace}"); // Clear and delete

// Clicking
cy.get("button").click();
cy.get("button").click({ force: true }); // Force click even if covered
cy.get("button").dblclick();

// Checkboxes and Radio buttons
cy.get("input[type=checkbox]").check();
cy.get("input[type=checkbox]").uncheck();
cy.get("input[type=radio]").check("option1");

// Dropdowns (select elements)
cy.get("select").select("Option 1");
cy.get("select").select(1); // By index
cy.get("select").select(["Option 1", "Option 2"]); // Multiple

// Focus and blur
cy.get("input").focus();
cy.get("input").blur();
```

### 4. Assertions

**Visibility:**

```typescript
cy.get(".element").should("be.visible");
cy.get(".element").should("exist");
cy.get(".element").should("not.exist");
cy.get(".element").should("be.hidden");
```

**State:**

```typescript
cy.get("button").should("be.enabled");
cy.get("button").should("be.disabled");
cy.get("input").should("have.focus");
cy.get("input").should("be.checked");
```

**Text content:**

```typescript
cy.get(".element").should("have.text", "Exact text");
cy.get(".element").should("contain", "Partial text");
cy.get(".element").should("not.contain", "Text that shouldn't be there");
```

**Attributes and CSS:**

```typescript
cy.get(".element").should("have.class", "active");
cy.get(".element").should("have.attr", "href", "/home");
cy.get(".element").should("have.css", "color", "rgb(255, 0, 0)");
```

**Value (for inputs):**

```typescript
cy.get("input").should("have.value", "typed value");
```

### 5. Intercepting API Calls

```typescript
// Basic intercept
cy.intercept("POST", "/login").as("loginUser");

// Intercept with alias
cy.intercept("GET", "/users").as("getUsers");

// Intercept and modify response
cy.intercept("GET", "/users", {
  statusCode: 200,
  body: { users: [] },
}).as("getUsers");

// Intercept with function
cy.intercept("POST", "/login", (req) => {
  req.reply({
    statusCode: 200,
    body: { user: { id: "123" } },
  });
}).as("loginUser");

// Wait for intercept
cy.wait("@loginUser");

// Wait for multiple intercepts
cy.wait(["@loginUser", "@getUserProfile"]);

// Assert on intercept
cy.wait("@loginUser").then((interception) => {
  expect(interception.response.statusCode).to.eq(200);
  expect(interception.response.body.user).to.have.property("id");
});
```

### 6. URL Assertions

```typescript
cy.location("pathname").should("equal", "/");
cy.location("pathname").should("eq", "/signin");
cy.url().should("include", "/dashboard");
cy.url().should("match", /\/users\/\d+/);
```

## Complete Example: auth.spec.ts

```typescript
import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

const apiGraphQL = `${Cypress.env("apiUrl")}/graphql`;

describe("User Sign-up and Login", function () {
  beforeEach(function () {
    cy.task("db:seed");

    cy.intercept("POST", "/users").as("signup");

    // Conditionally intercept GraphQL
    cy.intercept("POST", apiGraphQL, (req) => {
      const { body } = req;
      if (body.hasOwnProperty("operationName") && body.operationName === "CreateBankAccount") {
        req.alias = "gqlCreateBankAccountMutation";
      }
    });
  });

  it("should redirect unauthenticated user to signin page", function () {
    cy.visit("/personal");
    cy.location("pathname").should("equal", "/signin");
    cy.visualSnapshot("Redirect to SignIn");
  });

  it("should redirect to the home page after login", function () {
    cy.database("find", "users").then((user: User) => {
      cy.login(user.username, "s3cret", { rememberUser: true });
    });
    cy.location("pathname").should("equal", "/");
  });

  it("should remember a user for 30 days after login", function () {
    cy.database("find", "users").then((user: User) => {
      cy.login(user.username, "s3cret", { rememberUser: true });
    });

    // Verify Session Cookie has expiry
    cy.getCookie("connect.sid").should("have.property", "expiry");

    // Logout
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-signout").click();
    cy.location("pathname").should("eq", "/signin");
    cy.visualSnapshot("Redirect to SignIn");
  });

  it("should allow a visitor to sign-up, login, and logout", function () {
    const userInfo = {
      firstName: "Bob",
      lastName: "Ross",
      username: "PainterJoy90",
      password: "s3cret",
    };

    // Sign-up
    cy.visit("/");
    cy.getBySel("signup").click();
    cy.getBySel("signup-title").should("be.visible").and("contain", "Sign Up");
    cy.visualSnapshot("Sign Up Title");

    cy.getBySel("signup-first-name").type(userInfo.firstName);
    cy.getBySel("signup-last-name").type(userInfo.lastName);
    cy.getBySel("signup-username").type(userInfo.username);
    cy.getBySel("signup-password").type(userInfo.password);
    cy.getBySel("signup-confirmPassword").type(userInfo.password);
    cy.visualSnapshot("About to Sign Up");
    cy.getBySel("signup-submit").click();
    cy.wait("@signup");

    // Login
    cy.login(userInfo.username, userInfo.password);

    // Onboarding flow
    cy.getBySel("user-onboarding-dialog").should("be.visible");
    cy.getBySel("list-skeleton").should("not.exist");
    cy.getBySel("nav-top-notifications-count").should("exist");
    cy.visualSnapshot("User Onboarding Dialog");
    cy.getBySel("user-onboarding-next").click();

    // Create bank account
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Create Bank Account");
    cy.getBySelLike("bankName-input").type("The Best Bank");
    cy.getBySelLike("accountNumber-input").type("123456789");
    cy.getBySelLike("routingNumber-input").type("987654321");
    cy.visualSnapshot("About to complete User Onboarding");
    cy.getBySelLike("submit").click();
    cy.wait("@gqlCreateBankAccountMutation");

    // Complete onboarding
    cy.getBySel("user-onboarding-dialog-title").should("contain", "Finished");
    cy.getBySel("user-onboarding-dialog-content").should("contain", "You're all set!");
    cy.visualSnapshot("Finished User Onboarding");
    cy.getBySel("user-onboarding-next").click();

    // Verify main page
    cy.getBySel("transaction-list").should("be.visible");
    cy.visualSnapshot("Transaction List is visible after User Onboarding");

    // Logout
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }
    cy.getBySel("sidenav-signout").click();
    cy.location("pathname").should("eq", "/signin");
    cy.visualSnapshot("Redirect to SignIn");
  });

  it("should display login errors", function () {
    cy.visit("/");

    // Username validation
    cy.getBySel("signin-username").type("User");
    cy.getBySel("signin-username").find("input").clear();
    cy.getBySel("signin-username").find("input").blur();
    cy.get("#username-helper-text").should("be.visible").and("contain", "Username is required");
    cy.visualSnapshot("Display Username is Required Error");

    // Password validation
    cy.getBySel("signin-password").type("abc");
    cy.getBySel("signin-password").find("input").blur();
    cy.get("#password-helper-text")
      .should("be.visible")
      .and("contain", "Password must contain at least 4 characters");
    cy.visualSnapshot("Display Password Error");

    // Submit disabled
    cy.getBySel("signin-submit").should("be.disabled");
    cy.visualSnapshot("Sign In Submit Disabled");
  });

  it("should display signup errors", function () {
    cy.intercept("GET", "/signup");
    cy.visit("/signup");

    // Test all required fields
    cy.getBySel("signup-first-name").type("First");
    cy.getBySel("signup-first-name").find("input").clear();
    cy.getBySel("signup-first-name").find("input").blur();
    cy.get("#firstName-helper-text").should("be.visible").and("contain", "First Name is required");

    cy.getBySel("signup-last-name").type("Last");
    cy.getBySel("signup-last-name").find("input").clear();
    cy.getBySel("signup-last-name").find("input").blur();
    cy.get("#lastName-helper-text").should("be.visible").and("contain", "Last Name is required");

    cy.getBySel("signup-username").type("User");
    cy.getBySel("signup-username").find("input").clear();
    cy.getBySel("signup-username").find("input").blur();
    cy.get("#username-helper-text").should("be.visible").and("contain", "Username is required");

    cy.getBySel("signup-password").type("password");
    cy.getBySel("signup-password").find("input").clear();
    cy.getBySel("signup-password").find("input").blur();
    cy.get("#password-helper-text").should("be.visible").and("contain", "Enter your password");

    // Password mismatch
    cy.getBySel("signup-confirmPassword").type("DIFFERENT PASSWORD");
    cy.getBySel("signup-confirmPassword").find("input").blur();
    cy.get("#confirmPassword-helper-text")
      .should("be.visible")
      .and("contain", "Password does not match");
    cy.visualSnapshot("Display Sign Up Required Errors");

    cy.getBySel("signup-submit").should("be.disabled");
    cy.visualSnapshot("Sign Up Submit Disabled");
  });

  it("should error for an invalid user", function () {
    cy.login("invalidUserName", "invalidPa$$word");

    cy.getBySel("signin-error")
      .should("be.visible")
      .and("have.text", "Username or password is invalid");
    cy.visualSnapshot("Sign In, Invalid Username and Password");
  });

  it("should error for an invalid password for existing user", function () {
    cy.database("find", "users").then((user: User) => {
      cy.login(user.username, "INVALID");
    });

    cy.getBySel("signin-error")
      .should("be.visible")
      .and("have.text", "Username or password is invalid");
    cy.visualSnapshot("Sign In, Invalid Password");
  });
});
```

## Advanced Example: new-transaction.spec.ts

```typescript
import Dinero from "dinero.js";
import { User } from "../../../src/models";
import { isMobile } from "../../support/utils";

type NewTransactionTestCtx = {
  allUsers?: User[];
  user?: User;
  contact?: User;
};

describe("New Transaction", function () {
  const ctx: NewTransactionTestCtx = {};

  beforeEach(function () {
    cy.task("db:seed");

    // Set up all intercepts
    cy.intercept("GET", "/users*").as("allUsers");
    cy.intercept("GET", "/users/search*").as("usersSearch");
    cy.intercept("POST", "/transactions").as("createTransaction");
    cy.intercept("GET", "/notifications").as("notifications");
    cy.intercept("GET", "/transactions/public").as("publicTransactions");
    cy.intercept("GET", "/transactions").as("personalTransactions");
    cy.intercept("PATCH", "/transactions/*").as("updateTransaction");

    cy.database("filter", "users").then((users: User[]) => {
      ctx.allUsers = users;
      ctx.user = users[0];
      ctx.contact = users[1];
      return cy.loginByXstate(ctx.user.username);
    });
  });

  it("navigates to the new transaction form, selects a user and submits a transaction payment", function () {
    const payment = {
      amount: "35",
      description: "Sushi dinner 🍣",
    };

    // Navigate to new transaction
    cy.getBySelLike("new-transaction").click();
    cy.wait("@allUsers");

    // Search for user
    cy.getBySel("user-list-search-input").type(ctx.contact!.firstName, { force: true });
    cy.wait("@usersSearch");
    cy.visualSnapshot("User Search First Name Input");

    // Select user
    cy.getBySelLike("user-list-item").contains(ctx.contact!.firstName).click({ force: true });
    cy.visualSnapshot("User Search First Name List Item");

    // Fill form
    cy.getBySelLike("amount-input").type(payment.amount);
    cy.getBySelLike("description-input").type(payment.description);
    cy.visualSnapshot("Amount and Description Input");

    // Submit
    cy.getBySelLike("submit-payment").click();
    cy.wait(["@createTransaction", "@getUserProfile"]);

    // Verify success
    cy.getBySel("alert-bar-success")
      .should("be.visible")
      .and("have.text", "Transaction Submitted!");

    // Calculate expected balance
    const updatedAccountBalance = Dinero({
      amount: ctx.user!.balance - parseInt(payment.amount) * 100,
    }).toFormat();

    // Check balance (handle mobile)
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }

    cy.getBySelLike("user-balance").should("contain", updatedAccountBalance);
    cy.visualSnapshot("Updated User Balance");

    if (isMobile()) {
      cy.get(".MuiBackdrop-root").click({ force: true });
    }

    // Navigate and verify transaction in list
    cy.getBySelLike("create-another-transaction").click();
    cy.getBySel("app-name-logo").find("a").click();
    cy.getBySelLike("personal-tab").click();
    cy.getBySelLike("personal-tab").should("have.class", "Mui-selected");
    cy.wait("@personalTransactions");

    cy.getBySel("transaction-list").first().should("contain", payment.description);

    // Verify database updated
    cy.database("find", "users", { id: ctx.contact!.id })
      .its("balance")
      .should("equal", ctx.contact!.balance + parseInt(payment.amount) * 100);

    cy.getBySel("alert-bar-success").should("not.exist");
    cy.visualSnapshot("Personal List Validate Transaction in List");
  });

  it("submits a transaction payment and verifies the deposit for the receiver", function () {
    cy.getBySel("nav-top-new-transaction").click();

    const transactionPayload = {
      transactionType: "payment",
      amount: 25,
      description: "Indian Food",
      sender: ctx.user,
      receiver: ctx.contact,
    };

    // Get starting balance
    let startBalance: string;
    if (!isMobile()) {
      cy.get("[data-test=sidenav-user-balance]")
        .invoke("text")
        .then((x) => {
          startBalance = x;
          expect(startBalance).to.match(/\$\d/);
        });
    }

    // Create transaction via state machine
    cy.createTransaction(transactionPayload);
    cy.wait("@createTransaction");
    cy.getBySel("new-transaction-create-another-transaction").should("be.visible");

    // Verify balance changed
    if (!isMobile()) {
      cy.get("[data-test=sidenav-user-balance]").should(($el) => {
        expect($el.text()).to.not.equal(startBalance);
      });
    }
    cy.visualSnapshot("Transaction Payment Submitted Notification");

    // Switch to receiver and verify balance
    cy.switchUserByXstate(ctx.contact!.username);

    const updatedAccountBalance = Dinero({
      amount: ctx.contact!.balance + transactionPayload.amount * 100,
    }).toFormat();

    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
    }

    cy.getBySelLike("user-balance").should("contain", updatedAccountBalance);
    cy.visualSnapshot("Verify Updated Sender Account Balance");
  });

  // Parameterized test example
  context("searches for a user by attribute", function () {
    const searchAttrs: (keyof User)[] = [
      "firstName",
      "lastName",
      "username",
      "email",
      "phoneNumber",
    ];

    beforeEach(function () {
      cy.getBySelLike("new-transaction").click();
      cy.wait("@allUsers");
    });

    searchAttrs.forEach((attr: keyof User) => {
      it(attr, function () {
        const targetUser = ctx.allUsers![2];

        cy.log(`Searching by **${attr}**`);
        cy.getBySel("user-list-search-input").type(targetUser[attr] as string, { force: true });

        cy.wait("@usersSearch")
          .its("response.body.results")
          .should("have.length.gt", 0)
          .its("length")
          .then((resultsN) => {
            cy.getBySelLike("user-list-item")
              .should("have.length", resultsN)
              .first()
              .contains(targetUser[attr] as string);
          });

        cy.visualSnapshot(`User List for Search: ${attr} = ${targetUser[attr]}`);

        cy.focused().clear();
        cy.getBySel("users-list").should("be.empty");
        cy.visualSnapshot("User List Clear Search");
      });
    });
  });
});
```

## UI Testing Patterns

### 1. Use Custom Commands for Common Actions

```typescript
// Instead of:
cy.visit("/signin");
cy.get("[data-test=signin-username]").type("john");
cy.get("[data-test=signin-password]").type("s3cret");
cy.get("[data-test=signin-submit]").click();
cy.wait("@loginUser");

// Use:
cy.login("john", "s3cret");
```

### 2. Always Wait for API Calls

```typescript
cy.intercept("POST", "/transactions").as("createTransaction");
cy.get("button").click();
cy.wait("@createTransaction"); // Wait before asserting
```

### 3. Handle Mobile Responsiveness

```typescript
import { isMobile } from "../../support/utils";

if (isMobile()) {
  cy.getBySel("sidenav-toggle").click();
}
```

### 4. Use Visual Snapshots

```typescript
cy.visualSnapshot("After Login");
cy.visualSnapshot("Form Submitted");
```

### 5. Parameterize Tests

```typescript
["firstName", "lastName", "email"].forEach((attr) => {
  it(`searches by ${attr}`, function () {
    // Test implementation
  });
});
```

### 6. Assert on Database State

```typescript
cy.database("find", "users", { id: userId }).its("balance").should("equal", expectedBalance);
```

## Common UI Testing Commands

| Command               | Purpose              |
| --------------------- | -------------------- |
| `cy.visit(url)`       | Navigate to URL      |
| `cy.get(selector)`    | Find element         |
| `cy.contains(text)`   | Find by text         |
| `cy.getBySel(name)`   | Find by data-test    |
| `.type(text)`         | Type text            |
| `.click()`            | Click element        |
| `.clear()`            | Clear input          |
| `.check()`            | Check checkbox       |
| `.select(value)`      | Select dropdown      |
| `cy.wait(alias)`      | Wait for intercept   |
| `cy.intercept()`      | Intercept API        |
| `cy.location()`       | Get/verify URL       |
| `.should()`           | Assertion            |
| `cy.visualSnapshot()` | Take visual snapshot |

## Assertion Patterns

```typescript
// Visibility
cy.get(".element").should("be.visible");
cy.get(".element").should("exist");
cy.get(".element").should("not.exist");

// State
cy.get("button").should("be.enabled");
cy.get("button").should("be.disabled");

// Text
cy.get(".element").should("have.text", "Exact");
cy.get(".element").should("contain", "Partial");

// Attributes
cy.get(".element").should("have.class", "active");
cy.get(".element").should("have.attr", "href", "/home");

// Value
cy.get("input").should("have.value", "typed");

// Chaining
cy.get(".element").should("be.visible").and("have.class", "active").and("contain", "text");
```

## Running UI Tests

```bash
# Run all UI tests
yarn cypress:run --spec 'cypress/tests/ui/*'

# Run specific test
yarn cypress:run --spec "cypress/tests/ui/auth.spec.ts"

# Run in mobile viewport
yarn cypress:run:mobile

# Open interactive mode
yarn cypress:open
```
