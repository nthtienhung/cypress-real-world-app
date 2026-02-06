# Cypress Real World App - Test Automation Learning Guide

## Welcome!

This learning guide contains everything you need to understand the Cypress test automation in this project. Start with the overview and work your way through each section.

## Learning Path

### 1. Start Here

- **[00-overview.md](00-overview.md)** - Project structure and what you'll learn

### 2. Core Concepts

- **[01-configuration.md](01-configuration.md)** - How Cypress is configured
- **[02-custom-commands.md](02-custom-commands.md)** - Reusable test commands
- **[06-typescript-types.md](06-typescript-types.md)** - TypeScript for Cypress

### 3. Test Types

- **[03-api-testing.md](03-api-testing.md)** - Testing backend APIs
- **[04-ui-testing.md](04-ui-testing.md)** - End-to-end browser tests
- **[05-component-testing.md](05-component-testing.md)** - Isolated component tests

### 4. Best Practices

- **[07-best-practices.md](07-best-practices.md)** - Patterns and anti-patterns
- **[08-quick-reference.md](08-quick-reference.md)** - Quick command reference

## How to Use This Guide

1. **Read in order** (00 → 01 → 02, etc.) for comprehensive learning
2. **Jump to specific topics** using the Quick Reference
3. **Practice** by looking at actual test files in `cypress/tests/`
4. **Run tests** while reading to see them in action

## Key Files in the Actual Project

- `cypress.config.ts` - Main configuration
- `cypress/support/commands.ts` - Custom commands
- `cypress/support/e2e.ts` - E2E test setup
- `cypress/global.d.ts` - TypeScript types
- `cypress/tests/api/*.spec.ts` - API tests
- `cypress/tests/ui/*.spec.ts` - UI tests
- `src/**/*.cy.tsx` - Component tests

## Running the Tests

```bash
# Install dependencies
yarn

# Start the app
yarn dev

# In another terminal, open Cypress
yarn cypress:open
```

## Default Login Credentials

- **Username**: Any username from the database (run `yarn list:dev:users`)
- **Password**: `s3cret`

## Quick Start Commands

```bash
# Run all tests headlessly
yarn cypress:run

# Run specific test
yarn cypress:run --spec "cypress/tests/ui/auth.spec.ts"

# Run API tests only
yarn test:api

# Run with mobile viewport
yarn cypress:run:mobile
```

## What You'll Learn

By the end of this guide, you'll understand:

1. ✅ How Cypress configuration works
2. ✅ How to write custom commands
3. ✅ How to test APIs with `cy.request()`
4. ✅ How to test UI interactions
5. ✅ How to test React components in isolation
6. ✅ How to use TypeScript with Cypress
7. ✅ Best practices for maintainable tests

## Questions?

- Check the [Cypress Documentation](https://docs.cypress.io)
- Look at the actual test files in the project
- Review the [Quick Reference](08-quick-reference.md) for commands

---

**Happy Testing! 🎉**
