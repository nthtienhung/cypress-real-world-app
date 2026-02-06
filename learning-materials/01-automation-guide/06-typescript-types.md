# TypeScript Types Guide

## File: `cypress/global.d.ts`

This file extends Cypress TypeScript types with custom commands and properties.

## What is global.d.ts?

The `global.d.ts` file is a **TypeScript declaration file** that:

1. Extends Cypress's built-in types
2. Provides IntelliSense for custom commands
3. Catches type errors at compile time
4. Documents your custom API

## Basic Structure

```typescript
/// <reference types="cypress" />

declare namespace Cypress {
  // Import types from your app
  import { User } from "../src/models";

  // Extend the Chainable interface
  interface Chainable {
    // Your custom commands here
    customCommand(): Chainable<any>;
  }
}
```

## Complete Example: cypress/global.d.ts

```typescript
/// <reference types="cypress" />

declare namespace Cypress {
  // Import app types
  import { authService } from "../src/machines/authMachine";
  import { User, BankAccount, Transaction } from "../src/models";

  // Extend Window object for state machine access
  interface CustomWindow extends Window {
    authService: typeof authService;
    createTransactionService: any;
    publicTransactionService: any;
  }

  // Database query types
  type dbQueryArg = {
    entity: string;
    query: object | [object];
  };

  // Login options
  type LoginOptions = {
    rememberUser: boolean;
  };

  // Extend Chainable with all custom commands
  interface Chainable {
    /**
     * Window object with additional properties
     */
    window(options?: Partial<Loggable & Timeoutable>): Chainable<CustomWindow>;

    /**
     * Take Percy visual snapshot
     * @param maybeName Optional suffix for snapshot name
     */
    visualSnapshot(maybeName?: string): Chainable<any>;

    /**
     * Select element by data-test attribute
     */
    getBySel(dataTestAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;

    /**
     * Select element by partial data-test attribute
     */
    getBySelLike(dataTestPrefixAttribute: string, args?: any): Chainable<JQuery<HTMLElement>>;

    /**
     * Query database - find single record
     */
    database(operation: "find", entity: string, query?: object, log?: boolean): Chainable<any>;

    /**
     * Query database - filter records
     */
    database(operation: "filter", entity: string, query?: object, log?: boolean): Chainable<any[]>;

    /**
     * Access React component internals
     */
    reactComponent(): Chainable<any>;

    /**
     * Pick date range in calendar
     */
    pickDateRange(startDate: Date, endDate: Date): Chainable<void>;

    /**
     * Set transaction amount range slider
     */
    setTransactionAmountRange(min: number, max: number): Chainable<any>;

    /**
     * Navigate to next transaction feed page
     */
    nextTransactionFeedPage(service: string, page: number): Chainable<any>;

    /**
     * Login via UI
     */
    login(username: string, password: string, loginOptions?: LoginOptions): void;

    /**
     * Login via API request
     */
    loginByApi(username: string, password?: string): Chainable<Response>;

    /**
     * Login via Google API
     */
    loginByGoogleApi(): Chainable<Response>;

    /**
     * Login via Okta API
     */
    loginByOktaApi(username: string, password?: string): Chainable<Response>;

    /**
     * Login via Okta UI
     */
    loginByOkta(username: string, password: string): Chainable<Response>;

    /**
     * Login via XState state machine
     */
    loginByXstate(username: string, password?: string): Chainable<any>;

    /**
     * Logout via XState state machine
     */
    logoutByXstate(): Chainable<string>;

    /**
     * Login via Auth0
     */
    loginToAuth0(username: string, password: string): Chainable<any>;

    /**
     * Switch to different user
     */
    switchUserByXstate(username: string): Chainable<any>;

    /**
     * Create transaction via state machine
     */
    createTransaction(payload: {
      transactionType: string;
      amount: number;
      description: string;
      sender: User;
      receiver: User;
    }): Chainable<any>;

    /**
     * Login via Cognito API
     */
    loginByCognitoApi(username: string, password: string): Chainable<any>;

    /**
     * Login via Cognito UI
     */
    loginByCognito(username: string, password: string): Chainable<any>;
  }
}
```

## Why This Matters

### Without Types (No IntelliSense)

```typescript
cy.login("john", "secret", { rememberMe: true });
//                                 ^^^^^
// No error! But should be 'rememberUser'
```

### With Types (Catches Errors)

```typescript
cy.login("john", "secret", { rememberMe: true });
//                                 ^^^^^
// TypeScript error: Object literal may only specify known properties,
// and 'rememberMe' does not exist in type 'LoginOptions'
```

## Type Declaration Patterns

### 1. Simple Command with No Arguments

```typescript
interface Chainable {
  logoutByXstate(): Chainable<string>;
}
```

### 2. Command with Required Arguments

```typescript
interface Chainable {
  login(username: string, password: string): void;
}
```

### 3. Command with Optional Arguments

```typescript
interface Chainable {
  login(username: string, password: string, loginOptions?: LoginOptions): void;
}
```

### 4. Command with Default Values

```typescript
interface Chainable {
  loginByApi(username: string, password?: string): Chainable<Response>;
}
```

### 5. Command with Complex Object

```typescript
interface Chainable {
  createTransaction(payload: {
    transactionType: "payment" | "request";
    amount: number;
    description: string;
    sender: User;
    receiver: User;
  }): Chainable<any>;
}
```

### 6. Overloaded Command (Different Operations)

```typescript
interface Chainable {
  // Overload for 'find' operation
  database(operation: "find", entity: string, query?: object, log?: boolean): Chainable<any>;

  // Overload for 'filter' operation
  database(operation: "filter", entity: string, query?: object, log?: boolean): Chainable<any[]>;
}
```

Usage:

```typescript
// TypeScript knows this returns a single object
cy.database("find", "users", { id: "123" }).then((user: User) => {
  // user is User type
});

// TypeScript knows this returns an array
cy.database("filter", "users").then((users: User[]) => {
  // users is User[] type
});
```

### 7. Generic Chainable

```typescript
interface Chainable<Subject = any> {
  // Returns the same type as subject
  customCommand<T>(): Chainable<T>;
}
```

## Extending Window Object

When you access app internals via `cy.window()`:

```typescript
// In global.d.ts
declare namespace Cypress {
  interface CustomWindow extends Window {
    authService: {
      send: (event: string, data?: any) => void;
    };
    createTransactionService: any;
  }

  interface Chainable {
    window(options?: Partial<Loggable & Timeoutable>): Chainable<CustomWindow>;
  }
}

// In test
cy.window().then((win) => {
  win.authService.send("LOGIN", { username, password });
});
```

## Importing App Types

```typescript
// Import from your app's source code
import { User, Transaction, BankAccount } from "../src/models";
import { authService } from "../src/machines/authMachine";

// Use in type definitions
type dbQueryArg = {
  entity: "users" | "transactions" | "bankaccounts";
  query: Partial<User> | Partial<Transaction>;
};
```

## tsconfig.json for Cypress

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["es5", "dom"],
    "allowJs": true,
    "outDir": "../dist",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "types": ["cypress", "node"],
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"]
}
```

## TypeScript in Test Files

### Import Types

```typescript
// Import User type from models
import { User, Transaction } from "../../../src/models";

// Use in test context
type TestCtx = {
  user?: User;
  transaction?: Transaction;
};

describe("Transactions", function () {
  const ctx: TestCtx = {};

  beforeEach(function () {
    cy.database("find", "users").then((user: User) => {
      ctx.user = user;
    });
  });
});
```

### Type Assertions

```typescript
// Type assertion (tell TypeScript you know the type)
const user = ctx.authenticatedUser!; // Non-null assertion

// Or use type guard
if (ctx.user) {
  cy.login(ctx.user.username, "s3cret");
}
```

### Generic cy.request()

```typescript
// Type the response body
cy.request<User>("GET", apiUsers).then((response) => {
  // response.body is typed as User
  const user: User = response.body;
});
```

## Benefits of TypeScript in Tests

1. **Autocomplete** - IntelliSense shows available commands
2. **Error Detection** - Catch typos and wrong types at compile time
3. **Documentation** - Types serve as documentation
4. **Refactoring** - Rename with confidence
5. **IDE Support** - Better navigation and tooltips

## Common Type Errors and Fixes

### Error: Property does not exist

```typescript
cy.customCommand();
// Error: Property 'customCommand' does not exist on type...

// Fix: Add to global.d.ts
interface Chainable {
  customCommand(): Chainable<any>;
}
```

### Error: Argument of type is not assignable

```typescript
cy.login("john", 123);
// Error: Argument of type 'number' is not assignable to 'string'

// Fix: Pass correct type
cy.login("john", "secret");
```

### Error: Object literal may only specify known properties

```typescript
cy.login("john", "secret", { rememberMe: true });
// Error: 'rememberMe' does not exist

// Fix: Use correct property name
cy.login("john", "secret", { rememberUser: true });
```

## Quick Reference: Common Types

| Type                  | Description         | Example               |
| --------------------- | ------------------- | --------------------- |
| `Chainable<T>`        | Cypress chainable   | `Chainable<JQuery>`   |
| `JQuery<HTMLElement>` | jQuery element      | Element reference     |
| `Response`            | HTTP response       | `cy.request()` return |
| `Loggable`            | Cypress log options | `{ log: false }`      |
| `Timeoutable`         | Timeout options     | `{ timeout: 5000 }`   |
