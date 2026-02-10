# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Directive

**Always provide the most professional and concise solution.** Optimize for clarity, efficiency, and maintainability. Avoid unnecessary complexity.

**Be concise in responses.** Provide direct answers without lengthy explanations unless requested. Focus on actionable code and essential information.

## Overview

This is a Cypress testing demonstration project featuring a full-stack payment application. The focus is on **real-world testing patterns**, not the application code itself.

**Tech Stack for Testing Context**:
- Frontend: React 18 + TypeScript + XState (state management)
- Backend: Express.js + lowdb (JSON file database)
- Testing: Cypress 15 (E2E, API, component tests)
- Build: Vite

**Ports**: Frontend on 3000, Backend API on 3001

## Common Commands for Testing

### Development

```bash
# Start both frontend (port 3000) and backend (port 3001) in development mode
yarn dev

# Start with code coverage instrumentation
yarn dev:coverage

# Start with empty database
yarn start:empty

# List development users (username/password for login)
yarn list:dev:users

# Start servers for testing (CI mode)
yarn start:ci

# Generate fresh database seed data
yarn db:seed
```

### Cypress Testing

```bash
# Open Cypress Test Runner (interactive)
yarn cypress:open

# Run all E2E tests headlessly
yarn cypress:run

# Run specific test suites
yarn test:api                    # API tests only
yarn cypress:run:component       # Component tests

# Run mobile viewport tests
yarn cypress:run:mobile

# Open Cypress in mobile viewport mode
yarn cypress:open:mobile
```

### Unit Testing

```bash
# Run unit tests with Vitest
yarn test:unit

# Run unit tests in CI mode
yarn test:unit:ci
```

## Cypress Testing Structure

### Configuration

**File**: `cypress.config.ts`

**Key Settings**:
- `baseUrl`: `http://localhost:3000` (frontend)
- `apiUrl` (env): `http://localhost:3001` (backend)
- `projectId`: `7s5okt` (Cypress Cloud)
- `retries.runMode`: 2 (automatic retries in CI)
- Code coverage enabled via `@cypress/code-coverage`

### Test Organization

```
cypress/
├── tests/
│   ├── api/                    # API endpoint tests (9 specs)
│   ├── ui/                     # UI E2E tests (7 specs)
│   ├── ui-auth-providers/      # OAuth provider tests
│   └── demo/                   # Demo/studio tests
├── support/
│   ├── e2e.ts                  # E2E support file
│   ├── commands.ts             # Custom Cypress commands
│   └── component.ts            # Component testing support
└── fixtures/                   # Test data fixtures
```

### Cypress Tasks (Database Operations)

Defined in `cypress.config.ts`:

| Task | Purpose | Usage Example |
|------|---------|---------------|
| `db:seed` | Reseed database with fresh test data | `cy.task("db:seed")` |
| `filter:database` | Query test data with filters | `cy.task("filter:database", { entity: "users", query: { firstName: "Jane" } })` |
| `find:database` | Find specific test data | `cy.task("find:database", { entity: "transactions", query: { id: "123" } })` |
| `getAuth0Credentials` | Get Auth0 test credentials | `cy.task("getAuth0Credentials")` |
| `getOktaCredentials` | Get Okta test credentials | `cy.task("getOktaCredentials")` |
| `getCognitoCredentials` | Get Cognito test credentials | `cy.task("getCognitoCredentials")` |
| `getGoogleCredentials` | Get Google test credentials | `cy.task("getGoogleCredentials")` |

### Database Seeding in Tests

**How it works**:
1. Tests use `cy.task("db:seed")` to reset database between tests
2. This calls backend `/testData/seed` endpoint
3. Database is restored to `data/database-seed.json` state
4. Tests can then query specific data via `filter:database` and `find:database` tasks

**In practice** (from `cypress/support/e2e.ts`):
```typescript
beforeEach(() => {
  cy.task("db:seed")
})
```

### Test Data

**Default Credentials**:
- All development users have password: `s3cred`
- Use `yarn list:dev:users` to see available usernames

**Database File**: `data/database.json` (reseeded on each `yarn dev` or `yarn start`)

### Test Order

Cypress runs tests **alphabetically by filename**. Within files, tests run in **order of appearance**.

### Custom Commands

Check `cypress/support/commands.ts` for custom commands used across tests.

## CI/CD

### GitHub Actions Workflows

Location: `.github/workflows/`

**Key workflows**:
- `main.yml` - Main CI pipeline (runs on push, PRs, schedule)
- `ci-practice.yml` - Practice workflow for learning

### Running Cypress in CI

**Using Cypress GitHub Action** (recommended):
```yaml
- uses: cypress-io/github-action@v6
  with:
    start: yarn start:ci          # Start app automatically
    wait-on: "http://localhost:3000"
    wait-on-timeout: 120
    browser: chrome
    spec: cypress/tests/ui/auth.spec.ts
```

**Manual server start**:
```yaml
- name: Start app
  run: yarn start:ci &
- name: Wait for app
  run: npx wait-on http://localhost:3000 --timeout 120000
- name: Run tests
  run: yarn cypress run --browser chrome
```

### Cypress Cloud Integration

- **Project ID**: `7s5okt`
- Set `CYPRESS_RECORD_KEY` in GitHub secrets for test recording
- Enable `record: true` in Cypress GitHub Action
- Use `parallel: true` for parallel execution across multiple containers

### Running Specific Test Suites

```bash
# API tests only
yarn cypress run --spec "cypress/tests/api/*.spec.ts"

# UI tests only
yarn cypress run --spec "cypress/tests/ui/*.spec.ts"

# Specific spec
yarn cypress run --spec "cypress/tests/ui/auth.spec.ts"

# Multiple specs
yarn cypress run --spec "cypress/tests/ui/auth.spec.ts,cypress/tests/ui/bankaccounts.spec.ts"
```

## Environment Configuration

### Required for OAuth Providers (Optional)

Set in `.env` file (not in repo):

**Auth0**: `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENTID`, `AUTH0_USERNAME`, `AUTH0_PASSWORD`

**Okta**: `VITE_OKTA_DOMAIN`, `VITE_OKTA_CLIENTID`, `OKTA_USERNAME`, `OKTA_PASSWORD`

**AWS Cognito**: `AWS_COGNITO_DOMAIN`, `AWS_COGNITO_USERNAME`, `AWS_COGNITO_PASSWORD`, plus mock AWS exports in `scripts/mock-aws-exports*.js`

**Google**: `VITE_GOOGLE_CLIENTID`, `VITE_GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`

### Switching Auth Providers

1. Set environment variables for desired provider
2. Replace `src/index.tsx` with provider index file (e.g., `src/index.auth0.tsx`)
3. Run provider-specific dev script: `yarn dev:auth0`, `yarn dev:okta`, etc.
4. Only corresponding auth provider spec will pass

## Important Notes for Testing

### Port Configuration
- CI expects default ports (3000/3001)
- If changed locally, update `cypress.config.ts` but **do not commit**

### AWS Cognito Files
- `scripts/mock-aws-exports.js` and `scripts/mock-aws-exports-es5.js` must exist for Cognito/CI builds
- Generated from AWS Amplify CLI or created manually
- Required by `prebuild:ci` and `predev:cognito:ci` hooks

### Node.js & Package Manager
- **Node version**: 20 or 22 (see `.node-version`)
- **Package manager**: Yarn Classic v1.x only (NOT compatible with Yarn Modern v2+)

### Mobile Testing
- Mobile viewport: 375x667 (iPhone SE)
- Use `yarn cypress:open:mobile` or `yarn cypress:run:mobile`

### Coverage Reporting
```bash
# Start with coverage
yarn dev:coverage

# Run tests with coverage
yarn cypress:run --env coverage=true

# View report
open coverage/index.html
```
