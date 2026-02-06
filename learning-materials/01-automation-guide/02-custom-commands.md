# Custom Commands Reference

## File: `cypress/support/commands.ts`

Custom commands extend Cypress with reusable, domain-specific actions. They appear in the Command Log and can be chained like native Cypress commands.

## How Custom Commands Work

### 1. Define the Command

```typescript
Cypress.Commands.add("commandName", (arg1, arg2, options = {}) => {
  // Command implementation
  return cy.get("...").click();
});
```

### 2. Add TypeScript Types

In `cypress/global.d.ts`:

```typescript
declare namespace Cypress {
  interface Chainable {
    commandName(arg1: string, arg2: string, options?: object): Chainable<any>;
  }
}
```

### 3. Use in Tests

```typescript
cy.commandName("value1", "value2", { option: true });
```

## Complete Command Reference

### 1. `cy.visualSnapshot()` - Visual Testing

**Purpose:** Take Percy snapshots for visual regression testing

```typescript
Cypress.Commands.add("visualSnapshot", (maybeName) => {
  // Get current test title from Cypress internal state
  let snapshotTitle = cy.state("runnable").fullTitle();

  if (maybeName) {
    snapshotTitle = snapshotTitle + " - " + maybeName;
  }

  // Take snapshot with current viewport dimensions
  cy.percySnapshot(snapshotTitle, {
    widths: [cy.state("viewportWidth")],
    minHeight: cy.state("viewportHeight"),
  });
});
```

**Usage:**

```typescript
cy.visualSnapshot(); // Uses test title
cy.visualSnapshot("After Login"); // Appends to test title
cy.visualSnapshot("Form Submitted");
```

**TypeScript:**

```typescript
visualSnapshot(maybeName?: string): Chainable<any>;
```

---

### 2. `cy.getBySel()` - Data-Test Selectors

**Purpose:** Select elements by `data-test` attribute (exact match)

```typescript
Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});
```

**Usage:**

```typescript
cy.getBySel("signin-username"); // [data-test=signin-username]
cy.getBySel("submit-button"); // [data-test=submit-button]
```

**TypeScript:**

```typescript
getBySel(dataTestAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;
```

---

### 3. `cy.getBySelLike()` - Partial Data-Test Match

**Purpose:** Select elements by partial `data-test` attribute match

```typescript
Cypress.Commands.add("getBySelLike", (selector, ...args) => {
  return cy.get(`[data-test*=${selector}]`, ...args);
});
```

**Usage:**

```typescript
cy.getBySelLike("transaction-item"); // [data-test*=transaction-item]
cy.getBySelLike("user-list"); // Matches data-test="user-list-item", etc.
```

**TypeScript:**

```typescript
getBySelLike(dataTestPrefixAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;
```

---

### 4. `cy.login()` - UI Login Flow

**Purpose:** Log in through the UI (full user experience)

```typescript
Cypress.Commands.add("login", (username, password, { rememberUser = false } = {}) => {
  // Create custom log entry in Command Log
  const log = Cypress.log({
    name: "login",
    displayName: "LOGIN",
    message: [`🔐 Authenticating | ${username}`],
    autoEnd: false,
  });

  // Intercept API calls
  cy.intercept("POST", "/login").as("loginUser");
  cy.intercept("GET", "checkAuth").as("getUserProfile");

  // Navigate to signin if not already there
  cy.location("pathname", { log: false }).then((currentPath) => {
    if (currentPath !== "/signin") {
      cy.visit("/signin");
    }
  });

  log.snapshot("before"); // Screenshot before

  // Fill form
  cy.getBySel("signin-username").type(username);
  cy.getBySel("signin-password").type(password);

  if (rememberUser) {
    cy.getBySel("signin-remember-me").find("input").check();
  }

  cy.getBySel("signin-submit").click();

  // Wait for API and log result
  cy.wait("@loginUser").then((loginUser: any) => {
    log.set({
      consoleProps() {
        return {
          username,
          password,
          rememberUser,
          userId: loginUser.response.statusCode !== 401 && loginUser.response.body.user.id,
        };
      },
    });
    log.snapshot("after"); // Screenshot after
    log.end();
  });
});
```

**Usage:**

```typescript
cy.login("john_doe", "s3cret");
cy.login("john_doe", "s3cret", { rememberUser: true });
```

**TypeScript:**

```typescript
login(username: string, password: string, loginOptions?: { rememberUser: boolean }): void;
```

---

### 5. `cy.loginByApi()` - Programmatic Login

**Purpose:** Log in via API request (faster than UI)

```typescript
Cypress.Commands.add("loginByApi", (username, password = Cypress.env("defaultPassword")) => {
  return cy.request("POST", `${Cypress.env("apiUrl")}/login`, {
    username,
    password,
  });
});
```

**Usage:**

```typescript
cy.loginByApi("john_doe").then((response) => {
  expect(response.status).to.eq(200);
  expect(response.body.user).to.have.property("id");
});
```

**TypeScript:**

```typescript
loginByApi(username: string, password?: string): Chainable<Response>;
```

---

### 6. `cy.loginByXstate()` - State Machine Login

**Purpose:** Bypass UI by triggering login via app's XState state machine

```typescript
Cypress.Commands.add("loginByXstate", (username, password = Cypress.env("defaultPassword")) => {
  const log = Cypress.log({
    name: "loginbyxstate",
    displayName: "LOGIN BY XSTATE",
    message: [`🔐 Authenticating | ${username}`],
    autoEnd: false,
  });

  cy.intercept("POST", "/login").as("loginUser");
  cy.intercept("GET", "/checkAuth").as("getUserProfile");

  cy.visit("/signin", { log: false }).then(() => {
    log.snapshot("before");
  });

  // Access app's auth service directly from window
  cy.window({ log: false }).then((win) => {
    win.authService.send("LOGIN", { username, password });
  });

  cy.wait("@loginUser").then((loginUser) => {
    log.set({
      consoleProps() {
        return {
          username,
          password,
          userId: loginUser.response.body.user.id,
        };
      },
    });
  });

  // Wait for loading to complete
  return cy
    .getBySel("list-skeleton")
    .should("not.exist")
    .then(() => {
      log.snapshot("after");
      log.end();
    });
});
```

**Usage:**

```typescript
cy.loginByXstate("john_doe");
cy.loginByXstate("john_doe", "custom_password");
```

**Key Concept:** Accesses `window.authService` to trigger actions programmatically.

---

### 7. `cy.logoutByXstate()` - State Machine Logout

**Purpose:** Log out via state machine (bypasses UI)

```typescript
Cypress.Commands.add("logoutByXstate", () => {
  const log = Cypress.log({
    name: "logoutByXstate",
    displayName: "LOGOUT BY XSTATE",
    message: [`🔒 Logging out current user`],
    autoEnd: false,
  });

  cy.window({ log: false }).then((win) => {
    log.snapshot("before");
    win.authService.send("LOGOUT");
  });

  return cy
    .location("pathname")
    .should("equal", "/signin")
    .then(() => {
      log.snapshot("after");
      log.end();
    });
});
```

**Usage:**

```typescript
cy.logoutByXstate();
```

---

### 8. `cy.switchUserByXstate()` - Switch Users

**Purpose:** Log out current user and log in as different user

```typescript
Cypress.Commands.add("switchUserByXstate", (username) => {
  cy.logoutByXstate();
  return cy.loginByXstate(username).then(() => {
    if (isMobile()) {
      cy.getBySel("sidenav-toggle").click();
      cy.getBySel("sidenav-username").contains(username);
      cy.getBySel("sidenav-toggle").click({ force: true });
    } else {
      cy.getBySel("sidenav-username").contains(username);
    }
    cy.getBySel("list-skeleton").should("not.exist");
    cy.getBySelLike("transaction-item").should("have.length.greaterThan", 1);
  });
});
```

**Usage:**

```typescript
cy.switchUserByXstate("jane_doe");
```

---

### 9. `cy.createTransaction()` - Create Transaction via State Machine

**Purpose:** Create a transaction by interacting with XState service

```typescript
import { pick } from "lodash/fp";

Cypress.Commands.add("createTransaction", (payload) => {
  const log = Cypress.log({
    name: "createTransaction",
    displayName: "CREATE TRANSACTION",
    message: [`💸 (${payload.transactionType}): ${payload.sender.id} <> ${payload.receiver.id}`],
    autoEnd: false,
    consoleProps() {
      return payload;
    },
  });

  return cy
    .window({ log: false })
    .then((win) => {
      log.snapshot("before");

      // Set users in service
      win.createTransactionService.send("SET_USERS", payload);

      // Prepare payload
      const createPayload = pick(["amount", "description", "transactionType"], payload);

      // Trigger creation
      return win.createTransactionService.send("CREATE", {
        ...createPayload,
        senderId: payload.sender.id,
        receiverId: payload.receiver.id,
      });
    })
    .then(() => {
      log.snapshot("after");
      log.end();
    });
});
```

**Usage:**

```typescript
cy.createTransaction({
  transactionType: "payment",
  amount: 25,
  description: "Indian Food",
  sender: { id: "user1", ... },
  receiver: { id: "user2", ... },
});
```

---

### 10. `cy.database()` - Database Operations

**Purpose:** Query the test database from tests

```typescript
Cypress.Commands.add("database", (operation, entity, query, logTask = false) => {
  const params = { entity, query };

  const log = Cypress.log({
    name: "database",
    displayName: "DATABASE",
    message: [`🔎 ${operation}ing within ${entity} data`],
    autoEnd: false,
    consoleProps() {
      return params;
    },
  });

  return cy.task(`${operation}:database`, params, { log: logTask }).then((data) => {
    log.snapshot();
    log.end();
    return data;
  });
});
```

**Usage:**

```typescript
// Find single record
cy.database("find", "users", { id: "123" }).then((user) => {
  cy.log(user.username);
});

// Filter records
cy.database("filter", "users", { balance: { $gt: 1000 } }).then((users) => {
  cy.log(`Found ${users.length} users`);
});

// Get all
cy.database("filter", "users").then((allUsers) => {
  // all users
});
```

**TypeScript:**

```typescript
database(operation: "find", entity: string, query?: object, log?: boolean): Chainable<any>;
database(operation: "filter", entity: string, query?: object, log?: boolean): Chainable<any[]>;
```

---

### 11. `cy.loginByGoogleApi()` - Google OAuth

**Purpose:** Log in with Google OAuth programmatically

```typescript
Cypress.Commands.add("loginByGoogleApi", () => {
  cy.log("Logging in to Google");

  cy.task<{ clientSecret: string; refreshToken: string }>("getGoogleCredentials").then(
    ({ clientSecret, refreshToken }) => {
      // Exchange refresh token for access token
      cy.request({
        method: "POST",
        url: "https://www.googleapis.com/oauth2/v4/token",
        body: {
          grant_type: "refresh_token",
          client_id: Cypress.env("googleClientId"),
          client_secret: clientSecret,
          refresh_token: refreshToken,
        },
      }).then(({ body }) => {
        const { access_token, id_token } = body;

        // Get user info
        cy.request({
          method: "GET",
          url: "https://www.googleapis.com/oauth2/v3/userinfo",
          headers: { Authorization: `Bearer ${access_token}` },
        }).then(({ body }) => {
          // Store in localStorage (how app expects it)
          const userItem = {
            token: id_token,
            user: {
              googleId: body.sub,
              email: body.email,
              givenName: body.given_name,
              familyName: body.family_name,
              imageUrl: body.picture,
            },
          };

          window.localStorage.setItem("googleCypress", JSON.stringify(userItem));
          cy.visit("/");
        });
      });
    }
  );
});
```

---

### 12. `cy.reactComponent()` - Access React Internals

**Purpose:** Access React component instance for advanced interactions

```typescript
Cypress.Commands.add("reactComponent", { prevSubject: "element" }, ($el) => {
  if ($el.length !== 1) {
    throw new Error(`cy.component() requires element of length 1 but got ${$el.length}`);
  }

  // Find React fiber key
  const key = Object.keys($el.get(0)).find((key) => key.startsWith("__reactFiber$"));
  const domFiber = $el.prop(key);

  Cypress.log({
    name: "component",
    consoleProps() {
      return { component: domFiber };
    },
  });

  return domFiber.return;
});
```

**Usage:**

```typescript
cy.getBySelLike("filter-amount-range-slider")
  .reactComponent()
  .its("memoizedProps")
  .its("ownerState")
  .invoke("onChange", null, [min / 10, max / 10]);
```

---

### 13. `cy.setTransactionAmountRange()` - Complex Component Interaction

**Purpose:** Set slider value by calling React component callback

```typescript
Cypress.Commands.add("setTransactionAmountRange", (min, max) => {
  cy.getBySel("transaction-list-filter-amount-range-button").scrollIntoView();
  cy.getBySel("transaction-list-filter-amount-range-button").click({ force: true });

  return cy
    .getBySelLike("filter-amount-range-slider")
    .reactComponent()
    .its("memoizedProps")
    .its("ownerState")
    .invoke("onChange", null, [min / 10, max / 10]);
});
```

---

### 14. `cy.pickDateRange()` - Date Picker Interaction

**Purpose:** Select date range in custom calendar component

```typescript
import { differenceInMonths, parse as parseDate } from "date-fns";

Cypress.Commands.add("pickDateRange", (startDate, endDate) => {
  const log = Cypress.log({
    name: "pickDateRange",
    displayName: "PICK DATE RANGE",
    message: [`🗓 ${startDate.toDateString()} to ${endDate.toDateString()}`],
    autoEnd: false,
  });

  const selectDate = (date: Date) => {
    const targetDay = date.getDate();

    return cy
      .get(".react-calendar__navigation__label")
      .invoke("text")
      .then((label: string) => {
        const parsedDate = parseDate(label, "MMMM yyyy", new Date());
        const monthsDiff = differenceInMonths(new Date(), parsedDate);

        if (monthsDiff < 0) {
          for (let i = 0; i < Math.abs(monthsDiff); i++) {
            cy.get(".react-calendar__navigation__prev-button").click();
          }
        } else if (monthsDiff > 0) {
          for (let i = 0; i < monthsDiff; i++) {
            cy.get(".react-calendar__navigation__next-button").click();
          }
        }
      })
      .then(() => {
        cy.get(".react-calendar__month-view__days__day")
          .contains(new RegExp(`^${targetDay}$`))
          .click({ force: true });
      });
  };

  log.snapshot("before");
  cy.clock(startDate.getTime(), ["Date"]);

  cy.getBySelLike("filter-date-range-button").click({ force: true });
  cy.get(".react-calendar").should("be.visible");

  selectDate(startDate);
  selectDate(endDate).then(() => {
    log.snapshot("after");
    log.end();
  });

  cy.get(".react-calendar").should("not.exist");
});
```

---

## TypeScript Type Definitions

Add to `cypress/global.d.ts`:

```typescript
declare namespace Cypress {
  interface Chainable {
    visualSnapshot(maybeName?: string): Chainable<any>;
    getBySel(dataTestAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;
    getBySelLike(dataTestPrefixAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;
    login(username: string, password: string, loginOptions?: { rememberUser: boolean }): void;
    loginByApi(username: string, password?: string): Chainable<Response>;
    loginByXstate(username: string, password?: string): Chainable<any>;
    logoutByXstate(): Chainable<string>;
    switchUserByXstate(username: string): Chainable<any>;
    createTransaction(payload: object): Chainable<any>;
    database(operation: "find", entity: string, query?: object, log?: boolean): Chainable<any>;
    database(operation: "filter", entity: string, query?: object, log?: boolean): Chainable<any[]>;
    reactComponent(): Chainable<any>;
    pickDateRange(startDate: Date, endDate: Date): Chainable<void>;
    setTransactionAmountRange(min: number, max: number): Chainable<any>;
    loginByGoogleApi(): Chainable<Response>;
  }
}
```

## Best Practices for Custom Commands

1. **Always add TypeScript types** - Enables autocomplete and catches errors
2. **Use Cypress.log()** - Makes commands visible in Command Log with snapshots
3. **Return chainable** - Allow command chaining: `cy.login().getBySel("...")`
4. **Handle both mobile and desktop** - Check viewport for responsive behaviors
5. **Intercept API calls** - Wait for async operations to complete
6. **Use meaningful names** - `cy.login()` not `cy.l()`
7. **Default parameters** - Make options optional with sensible defaults
