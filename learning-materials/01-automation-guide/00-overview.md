# Cypress Test Automation - Overview

## What is This Project?

This is the **Cypress Real World App (RWA)** test automation suite - a comprehensive example of production-ready Cypress testing patterns for a payment application.

## Test Code Structure

```
cypress/
├── cypress.config.ts                 # Main test configuration
├── tests/
│   ├── api/                          # API integration tests
│   │   ├── api-users.spec.ts
│   │   ├── api-transactions.spec.ts
│   │   ├── api-bankaccounts.spec.ts
│   │   └── ...
│   ├── ui/                           # End-to-end UI tests
│   │   ├── auth.spec.ts
│   │   ├── new-transaction.spec.ts
│   │   ├── transaction-feeds.spec.ts
│   │   └── ...
│   ├── ui-auth-providers/            # 3rd party auth tests
│   │   ├── auth0.spec.ts
│   │   ├── okta.spec.ts
│   │   ├── cognito.spec.ts
│   │   └── google.spec.ts
│   └── demo/
│       └── cypress-studio.spec.ts
├── support/                          # Test infrastructure
│   ├── e2e.ts                        # E2E test setup
│   ├── component.ts                  # Component test setup
│   ├── commands.ts                   # Custom Cypress commands
│   ├── utils.ts                      # Test utilities
│   └── auth-provider-commands/
│       ├── auth0.ts
│       ├── okta.ts
│       └── cognito.ts
├── fixtures/                         # Test data
│   └── public-transactions.json
├── global.d.ts                       # TypeScript declarations
└── tsconfig.json                     # TypeScript config
```

## Test Types

### 1. API Tests (`cypress/tests/api/`)

- Test backend endpoints directly
- Use `cy.request()` for HTTP calls
- Fast and reliable
- Test authentication, CRUD operations, validation

### 2. UI Tests (`cypress/tests/ui/`)

- Full end-to-end browser tests
- Simulate real user interactions
- Test complete user flows
- Visual regression testing with Percy

### 3. Component Tests (`src/**/*.cy.tsx`)

- Test React components in isolation
- Fast execution
- Mock API responses
- Test component states

### 4. Auth Provider Tests (`cypress/tests/ui-auth-providers/`)

- Test OAuth integrations (Auth0, Okta, Cognito, Google)
- Demonstrate programmatic login
- Test external authentication flows

## Running the Tests

```bash
# Open Cypress interactive mode
yarn cypress:open

# Run all E2E tests headlessly
yarn cypress:run

# Run specific test file
yarn cypress:run --spec "cypress/tests/ui/auth.spec.ts"

# Run tests in mobile viewport
yarn cypress:run:mobile

# Run only API tests
yarn test:api

# Run component tests
yarn cypress:run:component

# Run with code coverage
yarn dev:coverage
yarn cypress:run --env coverage=true
```

## Key Technologies

- **Cypress 15**: Test framework
- **TypeScript**: Type safety and better IDE support
- **XState**: State machines (accessed in tests via `window` object)
- **Percy**: Visual regression testing
- **Faker**: Generate fake test data
- **lowdb**: JSON database for test data

## Next Steps

1. Read `01-configuration.md` to understand test setup
2. Read `02-custom-commands.md` for reusable test patterns
3. Read `03-api-testing.md` for backend testing
4. Read `04-ui-testing.md` for frontend testing
5. Read `05-component-testing.md` for isolated component tests
6. Read `06-typescript-types.md` for type definitions
7. Read `07-best-practices.md` for testing patterns

## Important Concepts

1. **Database Seeding**: Every test gets fresh data via `cy.task("db:seed")`
2. **Custom Commands**: Reusable actions like `cy.login()` and `cy.database()`
3. **Intercepts**: Wait for and mock API calls
4. **State Machines**: Access app internals via `window.authService`
5. **Data-Test Attributes**: Use `[data-test="element"]` for selectors
