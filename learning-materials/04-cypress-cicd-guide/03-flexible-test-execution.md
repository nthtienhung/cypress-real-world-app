# Section 03: Flexible Test Execution

## Learning Objectives

By the end of this section, you will understand:

- How to run tests by suite (API, UI, etc.)
- How to configure smoke vs regression test profiles
- How to use GitHub Actions matrix strategy
- How to create reusable workflow configurations

---

## Part 1: Test Organization

### Your Current Test Structure

```
cypress/tests/
├── api/                    # API test suite
│   ├── api-bankaccounts.spec.ts
│   ├── api-banktransfers.spec.ts
│   ├── api-comments.spec.ts
│   ├── api-contacts.spec.ts
│   ├── api-likes.spec.ts
│   ├── api-notifications.spec.ts
│   ├── api-testdata.spec.ts
│   ├── api-transactions.spec.ts
│   └── api-users.spec.ts
├── ui/                     # UI test suite
│   ├── auth.spec.ts
│   ├── bankaccounts.spec.ts
│   ├── new-transaction.spec.ts
│   ├── notifications.spec.ts
│   ├── transaction-feeds.spec.ts
│   ├── transaction-view.spec.ts
│   └── user-settings.spec.ts
└── demo/                   # Demo/test examples
    └── cypress-studio.spec.ts
```

### Test Suite Categories

| Category | Pattern | Use Case |
|----------|---------|----------|
| **Smoke Tests** | Critical paths only | Quick validation, PR checks |
| **API Tests** | `cypress/tests/api/*` | Backend validation |
| **UI Tests** | `cypress/tests/ui/*` | Frontend validation |
| **Regression** | All tests | Full coverage |
| **Demo** | `cypress/tests/demo/*` | Examples, debugging |

---

## Part 2: Running Tests by Suite

### Method 1: Using `--spec` Flag

```bash
# Run API tests only
yarn cypress run --spec "cypress/tests/api/*.spec.ts"

# Run UI tests only
yarn cypress run --spec "cypress/tests/ui/*.spec.ts"

# Run specific test files
yarn cypress run --spec "cypress/tests/api/api-users.spec.ts,cypress/tests/api/api-transactions.spec.ts"

# Run multiple patterns
yarn cypress run --spec "cypress/tests/api/*.spec.ts,cypress/tests/ui/auth.spec.ts"
```

### Method 2: Using `--config` with `specPattern`

```yaml
- uses: cypress-io/github-action@v6
  with:
    config: '{"e2e":{"specPattern":"cypress/tests/api/*.spec.ts"}}'
```

### Method 3: Using Cypress Configuration Files

Create `cypress.config.smoke.ts`:

```typescript
import { defineConfig } from "cypress";
import baseConfig from "./cypress.config";

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    specPattern: "cypress/tests/ui/auth.spec.ts",  // Smoke tests only
  },
});
```

Run with:
```bash
yarn cypress run --config-file cypress.config.smoke.ts
```

---

## Part 3: Defining Test Profiles

### Smoke Test Profile

**Purpose**: Quick validation of critical paths (5-10 minutes)

```yaml
smoke-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: cypress-io/github-action@v6
      with:
        start: yarn start:ci
        wait-on: "http://localhost:3000"
        spec: |
          cypress/tests/ui/auth.spec.ts
          cypress/tests/api/api-users.spec.ts
        config: '{"retries":{"runMode":0}}'  # No retries for smoke
```

### Regression Test Profile

**Purpose**: Full test suite coverage (30-60 minutes)

```yaml
regression-tests:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      containers: [1, 2, 3, 4, 5]
  steps:
    - uses: actions/checkout@v4
    - uses: cypress-io/github-action@v6
      with:
        start: yarn start:ci
        wait-on: "http://localhost:3000"
        record: true
        parallel: true
        group: "Regression - Chrome"
```

### API-Only Profile

```yaml
api-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: cypress-io/github-action@v6
      with:
        spec: "cypress/tests/api/*.spec.ts"
        # No need to start UI for API tests
        config: '{"baseUrl":""}'
```

### UI-Only Profile

```yaml
ui-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: cypress-io/github-action@v6
      with:
        start: yarn start:ci
        wait-on: "http://localhost:3000"
        spec: "cypress/tests/ui/*.spec.ts"
```

---

## Part 4: GitHub Actions Matrix Strategy

### Basic Matrix Example

Run tests across multiple browsers:

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          browser: ${{ matrix.browser }}
          start: yarn start:ci
```

### Matrix with Multiple Dimensions

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox]
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          browser: ${{ matrix.browser }}
```

This creates 4 jobs:
- chrome + ubuntu
- chrome + windows
- firefox + ubuntu
- firefox + windows

### Matrix with Parallel Execution

```yaml
jobs:
  ui-tests:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false  # Don't cancel other jobs if one fails
      matrix:
        containers: [1, 2, 3, 4, 5]
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          parallel: true
          record: true
          group: "UI - Chrome - Container ${{ matrix.containers }}"
```

---

## Part 5: Creating a Flexible Workflow

### Complete Example with Input Selection

```yaml
name: Flexible Cypress Tests

on:
  workflow_dispatch:
    inputs:
      test_suite:
        description: 'Test suite to run'
        required: true
        type: choice
        options:
          - smoke
          - regression
          - api-only
          - ui-only
          - auth-only
        default: smoke

      browser:
        description: 'Browser to use'
        required: true
        type: choice
        options:
          - chrome
          - firefox
          - edge
          - all
        default: chrome

      parallel:
        description: 'Run in parallel'
        type: boolean
        default: false

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install
        run: yarn install
      - name: Build
        run: yarn build:ci
      - name: Save build
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: build

  tests:
    needs: setup
    runs-on: ubuntu-latest
    strategy:
      matrix:
        # Only use matrix if browser = 'all'
        browser: ${{ inputs.browser == 'all' && fromJSON('["chrome","firefox","edge"]') || [inputs.browser] }}
        # Only use parallel if selected
        container: ${{ inputs.parallel && fromJSON('[1,2,3,4,5]') || [1] }}
    steps:
      - uses: actions/checkout@v4
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: build

      - name: Run tests
        uses: cypress-io/github-action@v6
        with:
          browser: ${{ matrix.browser }}
          start: yarn start:ci
          wait-on: "http://localhost:3000"
          parallel: ${{ inputs.parallel }}
          record: ${{ inputs.parallel }}
          group: "${{ inputs.test_suite }} - ${{ matrix.browser }}"
          spec: ${{ inputs.test_suite == 'api-only' && 'cypress/tests/api/*.spec.ts' ||
                    inputs.test_suite == 'ui-only' && 'cypress/tests/ui/*.spec.ts' ||
                    inputs.test_suite == 'auth-only' && 'cypress/tests/ui/auth.spec.ts' ||
                    inputs.test_suite == 'smoke' && 'cypress/tests/ui/auth.spec.ts' ||
                    'cypress/tests/**/*.spec.ts' }}
```

---

## Part 6: Using Complex Matrix with Includes/Excludes

```yaml
strategy:
  matrix:
    os: [ubuntu-latest]
    browser: [chrome, firefox]
    node-version: [20]
    include:
      # Add edge only on ubuntu
      - os: ubuntu-latest
        browser: edge
        node-version: 20
      # Add windows chrome
      - os: windows-latest
        browser: chrome
        node-version: 20
    exclude:
      # Exclude firefox on windows (not supported)
      - os: windows-latest
        browser: firefox
```

---

## Part 7: Dynamic Configuration with Scripts

### Create Test Runner Script

`scripts/run-tests.sh`:

```bash
#!/bin/bash

TEST_SUITE=${1:-all}
BROWSER=${2:-chrome}

case $TEST_SUITE in
  smoke)
    SPECS="cypress/tests/ui/auth.spec.ts"
    ;;
  api-only)
    SPECS="cypress/tests/api/*.spec.ts"
    ;;
  ui-only)
    SPECS="cypress/tests/ui/*.spec.ts"
    ;;
  regression|all)
    SPECS="cypress/tests/**/*.spec.ts"
    ;;
  *)
    echo "Unknown suite: $TEST_SUITE"
    exit 1
    ;;
esac

yarn cypress run --browser "$BROWSER" --spec "$SPECS"
```

Use in workflow:

```yaml
- name: Run tests
  run: ./scripts/run-tests.sh "${{ inputs.test_suite }}" "${{ inputs.browser }}"
```

---

## Exercise: Create Flexible Workflow

### Task 1: Create smoke test profile

Create a job that:
- Runs only auth tests
- Uses Chrome
- No retries
- Timeout 10 minutes

<details>
<summary>Solution</summary>

```yaml
smoke:
  timeout-minutes: 10
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: cypress-io/github-action@v6
      with:
        browser: chrome
        spec: cypress/tests/ui/auth.spec.ts
        config: '{"retries":{"runMode":0}}'
```

</details>

---

### Task 2: Create matrix for API tests

Create a job that runs API tests across Chrome and Firefox in parallel.

<details>
<summary>Solution</summary>

```yaml
api-tests:
  runs-on: ubuntu-latest
  strategy:
    matrix:
      browser: [chrome, firefox]
      shard: [1, 2, 3]
  steps:
    - uses: actions/checkout@v4
    - uses: cypress-io/github-action@v6
      with:
        browser: ${{ matrix.browser }}
        spec: cypress/tests/api/*.spec.ts
        parallel: true
        record: true
        group: "API - ${{ matrix.browser }} - Shard ${{ matrix.shard }}"
        config: '{"baseUrl":""}'
```

</details>

---

## Next Section

Ready to move on? [Section 04: Sequential Execution](./04-sequential-execution.md)
