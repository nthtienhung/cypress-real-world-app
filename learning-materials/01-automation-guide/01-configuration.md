# Cypress Configuration Deep Dive

## File: `cypress.config.ts`

This is the **heart** of your test configuration. It controls how Cypress runs, where it looks for tests, and what environment it sets up.

## Complete Configuration

```typescript
import path from "path";
import _ from "lodash";
import axios from "axios";
import dotenv from "dotenv";
import Promise from "bluebird";
import codeCoverageTask from "@cypress/code-coverage/task";
import { defineConfig } from "cypress";
import viteConfig from "./vite.cypress.config.ts";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config();

// AWS configuration (for Cognito auth)
let awsConfig = { default: undefined };
try {
  awsConfig = require(path.join(__dirname, "./aws-exports-es5.js"));
} catch (e) {}

export default defineConfig({
  // Project ID for Cypress Cloud (dashboard)
  projectId: "7s5okt",

  // Retry failed tests twice in headless mode
  retries: {
    runMode: 2,
  },

  // Environment variables accessible in tests via Cypress.env()
  env: {
    apiUrl: "http://localhost:3001",
    mobileViewportWidthBreakpoint: 414,
    coverage: false,
    codeCoverage: {
      url: "http://localhost:3001/__coverage__",
      exclude: "cypress/**/*.*",
    },
    defaultPassword: process.env.SEED_DEFAULT_USER_PASSWORD,
    paginationPageSize: process.env.PAGINATION_PAGE_SIZE,

    // Auth0
    auth0_domain: process.env.VITE_AUTH0_DOMAIN,

    // Okta
    okta_domain: process.env.VITE_OKTA_DOMAIN,
    okta_client_id: process.env.VITE_OKTA_CLIENTID,
    okta_programmatic_login: process.env.OKTA_PROGRAMMATIC_LOGIN || false,

    // Amazon Cognito
    cognito_domain: process.env.AWS_COGNITO_DOMAIN,
    cognito_programmatic_login: false,
    awsConfig: awsConfig.default,

    // Google
    googleClientId: process.env.VITE_GOOGLE_CLIENTID,
  },

  // Component Testing Configuration
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
      viteConfig,
    },
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}", // Find files ending in .cy.tsx
    supportFile: "cypress/support/component.ts",
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config); // Enable code coverage
      return config;
    },
  },

  // E2E Testing Configuration
  e2e: {
    baseUrl: "http://localhost:3000", // Your app's URL
    specPattern: "cypress/tests/**/*.spec.{js,jsx,ts,tsx}", // Test file pattern
    supportFile: "cypress/support/e2e.ts", // Runs before each test
    viewportHeight: 1000,
    viewportWidth: 1280,
    experimentalRunAllSpecs: true, // Run all specs in one browser session
    experimentalStudio: true, // Enable Cypress Studio (record interactions)

    // Node.js event handlers - runs in Node, NOT browser
    setupNodeEvents(on, config) {
      const testDataApiEndpoint = `${config.env.apiUrl}/testData`;

      // Helper function to query database
      const queryDatabase = ({ entity, query }, callback) => {
        const fetchData = async (attrs) => {
          const { data } = await axios.get(`${testDataApiEndpoint}/${entity}`);
          return callback(data, attrs);
        };
        return Array.isArray(query) ? Promise.map(query, fetchData) : fetchData(query);
      };

      // Register tasks that can be called from tests
      on("task", {
        // Reset database to seed state
        async "db:seed"() {
          const { data } = await axios.post(`${testDataApiEndpoint}/seed`);
          return data;
        },

        // Filter database records
        "filter:database"(queryPayload) {
          return queryDatabase(queryPayload, (data, attrs) => _.filter(data.results, attrs));
        },

        // Find single database record
        "find:database"(queryPayload) {
          return queryDatabase(queryPayload, (data, attrs) => _.find(data.results, attrs));
        },

        // Get Auth0 credentials from env
        getAuth0Credentials() {
          const username = process.env.AUTH0_USERNAME;
          const password = process.env.AUTH0_PASSWORD;
          if (!username || !password) {
            throw new Error("AUTH0_USERNAME and AUTH0_PASSWORD must be set");
          }
          return { username, password };
        },

        // Get Okta credentials from env
        getOktaCredentials() {
          const username = process.env.OKTA_USERNAME;
          const password = process.env.OKTA_PASSWORD;
          if (!username || !password) {
            throw new Error("OKTA_USERNAME and OKTA_PASSWORD must be set");
          }
          return { username, password };
        },

        // Get Cognito credentials from env
        getCognitoCredentials() {
          const username = process.env.AWS_COGNITO_USERNAME;
          const password = process.env.AWS_COGNITO_PASSWORD;
          if (!username || !password) {
            throw new Error("AWS_COGNITO_USERNAME and AWS_COGNITO_PASSWORD must be set");
          }
          return { username, password };
        },

        // Get Google credentials from env
        getGoogleCredentials() {
          const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
          const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
          if (!refreshToken || !clientSecret) {
            throw new Error("GOOGLE_REFRESH_TOKEN and VITE_GOOGLE_CLIENT_SECRET must be set");
          }
          return { refreshToken, clientSecret };
        },
      });

      codeCoverageTask(on, config);
      return config;
    },
  },
});
```

## Key Configuration Sections Explained

### 1. `projectId`

- Identifies your project in Cypress Cloud
- Enables parallelization, test history, and analytics

### 2. `retries`

```typescript
retries: {
  runMode: 2,    // Retry 2 times in headless/CI mode
  openMode: 0,   // Don't retry in interactive mode
}
```

### 3. `env` - Environment Variables

Accessible in tests via:

```typescript
Cypress.env("apiUrl"); // "http://localhost:3001"
Cypress.env("defaultPassword"); // "s3cret"
```

### 4. `baseUrl`

- Root URL for your application
- Enables using relative paths: `cy.visit("/signin")`
- Instead of: `cy.visit("http://localhost:3000/signin")`

### 5. `specPattern`

- Glob pattern to find test files
- `cypress/tests/**/*.spec.ts` = all .spec.ts files in tests folder and subfolders

### 6. `supportFile`

- File that runs before each test
- `e2e.ts` for E2E tests, `component.ts` for component tests
- Use for: setup, global intercepts, custom commands

### 7. `viewportWidth` / `viewportHeight`

- Default browser window size
- Override in tests: `cy.viewport(375, 667)` for mobile

### 8. `setupNodeEvents` - Node.js Tasks

**IMPORTANT**: This runs in Node.js, NOT the browser!

Use for:

- Database operations
- File system access
- Reading environment variables
- Running shell commands

#### How Tasks Work:

**1. Define in config:**

```typescript
on("task", {
  async "db:seed"() {
    // Node.js code here
    const { data } = await axios.post(`${testDataApiEndpoint}/seed`);
    return data;
  },
});
```

**2. Call from test:**

```typescript
cy.task("db:seed");
```

#### Database Query Tasks:

```typescript
"filter:database"({ entity: "users", query: { balance: 100 } });
// Returns: Array of users with balance = 100

"find:database"({ entity: "users", query: { id: "123" } });
// Returns: Single user object or undefined
```

## Component Testing Config

```typescript
component: {
  devServer: {
    framework: "react",
    bundler: "vite",      // or "webpack"
    viteConfig,            // Your vite config
  },
  specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
  supportFile: "cypress/support/component.ts",
}
```

Component tests:

- Are in `.cy.tsx` files next to components
- Mount components in isolation
- Run in a real browser
- Can mock API calls

## Support Files

### `cypress/support/e2e.ts`

Runs before every E2E test:

```typescript
import "@cypress/code-coverage/support";
import "./commands";
import { isMobile } from "./utils";

beforeEach(() => {
  // Remove caching headers
  cy.intercept(
    { url: "http://localhost:3001/**", middleware: true },
    (req) => delete req.headers["if-none-match"]
  );

  // Throttle API for mobile testing
  if (isMobile()) {
    cy.intercept({ url: "http://localhost:3001/**", middleware: true }, (req) => {
      req.on("response", (res) => {
        res.setThrottle(1000); // 1 Mbps
      });
    });
  }
});
```

### `cypress/support/component.ts`

Runs before every component test:

```typescript
import "@cypress/code-coverage/support";
import "./commands";
import { mount } from "cypress/react";

Cypress.Commands.add("mount", mount);
```

## Practical Examples

### Accessing Config Values

```typescript
// In tests
const apiUrl = Cypress.env("apiUrl");
const isMobile = Cypress.config("viewportWidth") < 414;
```

### Changing Viewport

```typescript
// Mobile test
cy.viewport(375, 667);
// or
cy.viewport("iphone-x");

// Desktop test
cy.viewport(1280, 720);
```

### Using Tasks

```typescript
// Reset database before test
beforeEach(() => {
  cy.task("db:seed");
});

// Query database
cy.task("find:database", {
  entity: "users",
  query: { username: "john_doe" },
}).then((user) => {
  cy.log(user.firstName);
});
```

## Environment Variables Priority

Cypress reads env vars from (highest to lowest priority):

1. `Cypress.env()` in tests
2. `env` in cypress.config.ts
3. `CYPRESS_*` environment variables
4. `.env` file (via dotenv)

Example:

```bash
CYPRESS_apiUrl=http://localhost:3002 yarn cypress:run
```
