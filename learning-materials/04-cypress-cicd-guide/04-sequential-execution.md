# Section 04: Sequential Execution

## Learning Objectives

By the end of this section, you will understand:

- How to use job dependencies with `needs`
- How to control test execution order
- How to pass data between jobs
- When to use sequential vs parallel execution

---

## Part 1: Job Dependencies

### The `needs` Keyword

By default, all jobs run **in parallel**. Use `needs` to create dependencies:

```yaml
jobs:
  job1:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job 1"

  job2:
    needs: job1  # Waits for job1 to complete successfully
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job 2"

  job3:
    needs: [job1, job2]  # Waits for BOTH job1 AND job2
    runs-on: ubuntu-latest
    steps:
      - run: echo "Job 3"
```

### Execution Visualization

```
Without needs:          With needs:
job1    job2            job1
  ↓      ↓                ↓
job3                  job2
                        ↓
                      job3
```

---

## Part 2: Common Sequential Patterns

### Pattern 1: Setup → Test → Report

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: yarn build:ci
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: build

  test:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: build
      - run: yarn cypress run

  report:
    needs: test
    runs-on: ubuntu-latest
    if: always()  # Run even if test fails
    steps:
      - run: echo "Generate test report"
```

### Pattern 2: Seed Data → Tests → Cleanup

```yaml
jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Seed database
        run: yarn db:seed

  test:
    needs: seed
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn cypress run

  cleanup:
    needs: test
    runs-on: ubuntu-latest
    if: always()  # Always cleanup, even if tests fail
    steps:
      - name: Cleanup test data
        run: yarn db:cleanup
```

### Pattern 3: Unit Tests → E2E Tests

```yaml
jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn test:unit:ci

  e2e:
    needs: unit  # Only run E2E if unit tests pass
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn cypress run
```

---

## Part 3: Passing Data Between Jobs

### Using Job Outputs

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      test-type: ${{ steps.set-output.outputs.test-type }}
      build-version: ${{ steps.version.outputs.version }}
    steps:
      - id: set-output
        run: echo "test-type=regression" >> $GITHUB_OUTPUT
      - id: version
        run: echo "version=1.2.3" >> $GITHUB_OUTPUT

  test:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - name: Use output
        run: |
          echo "Running ${{ needs.setup.outputs.test-type }} tests"
          echo "Build version: ${{ needs.setup.outputs.build-version }}"
```

### Using Artifacts

```yaml
jobs:
  create-config:
    runs-on: ubuntu-latest
    steps:
      - run: echo '{"testType":"smoke"}' > test-config.json
      - uses: actions/upload-artifact@v4
        with:
          name: config
          path: test-config.json

  test:
    needs: create-config
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: config
      - run: cat test-config.json
```

---

## Part 4: Conditional Job Execution

### Always Run Regardless of Previous Results

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: yarn cypress run

  notify:
    needs: test
    if: always()  # Runs even if test fails
    runs-on: ubuntu-latest
    steps:
      - run: echo "Send notification"
```

### Run Only on Success

```yaml
jobs:
  deploy:
    needs: test
    if: success()  # Only if test succeeds (this is the default)
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploy to production"
```

### Run Only on Failure

```yaml
jobs:
  debug:
    needs: test
    if: failure()  # Only if test fails
    runs-on: ubuntu-latest
    steps:
      - run: echo "Collect debug information"
```

### Complex Conditions

```yaml
jobs:
  tests:
    runs-on: ubuntu-latest
    outputs:
      result: ${{ steps.test.outcome }}
    steps:
      - id: test
        run: yarn cypress run

  on-failure:
    needs: tests
    if: needs.tests.outputs.result == 'failure'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Tests failed!"

  on-success:
    needs: tests
    if: needs.tests.outputs.result == 'success'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Tests passed!"
```

---

## Part 5: Sequential Test Execution Within Cypress

### Method 1: Using `--spec` Order

Tests run in the order specified:

```yaml
- run: |
    yarn cypress run --spec "
      cypress/tests/ui/auth.spec.ts
      cypress/tests/api/api-users.spec.ts
      cypress/tests/ui/transaction-feeds.spec.ts
    "
```

### Method 2: Using Configuration

In `cypress.config.ts`:

```typescript
export default defineConfig({
  e2e: {
    // Define test order
    specPattern: [
      "cypress/tests/api/api-users.spec.ts",
      "cypress/tests/ui/auth.spec.ts",
      "cypress/tests/ui/transaction-feeds.spec.ts",
    ],
    // OR use ordering
    testFiles: "**/*.spec.{js,ts}",
  },
});
```

### Method 3: Using Cypher/Grep with Dependencies

Cypress doesn't natively support test dependencies, but you can use:

```typescript
// In your test file
describe('Login required tests', () => {
  before(() => {
    // Ensure login happens first
    cy.login();
  });

  it('should do something after login', () => {
    // ...
  });
});
```

---

## Part 6: Complex Sequential Workflow Example

```yaml
name: Sequential Cypress Tests

on: workflow_dispatch

jobs:
  # Step 1: Install and validate
  install:
    runs-on: ubuntu-latest
    outputs:
      cache-hit: ${{ steps.cache.outputs.cache-hit }}
    steps:
      - uses: actions/checkout@v4
      - name: Cache dependencies
        id: cache
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}
      - name: Install
        if: steps.cache.outputs.cache-hit != 'true'
        run: yarn install
      - name: Type check
        run: yarn types
      - name: Lint
        run: yarn lint

  # Step 2: Build
  build:
    needs: install
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}
      - name: Build
        run: yarn build:ci
      - name: Upload build
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: build

  # Step 3: Unit tests
  unit-tests:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Restore node_modules
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}
      - name: Run unit tests
        run: yarn test:unit:ci

  # Step 4: API tests (after unit tests pass)
  api-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3]
    steps:
      - uses: actions/checkout@v4
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: build
      - name: Run API tests
        run: yarn cypress run --spec "cypress/tests/api/*.spec.ts" --parallel

  # Step 5: UI tests (after API tests pass)
  ui-tests:
    needs: api-tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox]
    steps:
      - uses: actions/checkout@v4
      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: build
      - name: Run UI tests
        uses: cypress-io/github-action@v6
        with:
          browser: ${{ matrix.browser }}
          start: yarn start:ci
          wait-on: "http://localhost:3000"
          spec: "cypress/tests/ui/*.spec.ts"

  # Step 6: Report (always runs)
  report:
    needs: [unit-tests, api-tests, ui-tests]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Generate report
        run: |
          echo "Unit tests: ${{ needs.unit-tests.result }}"
          echo "API tests: ${{ needs.api-tests.result }}"
          echo "UI tests: ${{ needs.ui-tests.result }}"
```

---

## Part 7: Best Practices for Sequential Execution

### DO ✅

| Practice | Reason |
|----------|--------|
| Use `needs` for setup dependencies | Avoid redundant work |
| Use `if: always()` for cleanup | Ensure cleanup happens |
| Use artifacts for build outputs | Share build artifacts between jobs |
| Combine sequential + parallel | Setup once, test in parallel |
| Use outputs for dynamic values | Pass data between jobs |

### DON'T ❌

| Anti-pattern | Reason |
|--------------|--------|
| Over-sequencing | Slows down pipeline unnecessarily |
| Deep job chains | Hard to debug, max 10 job dependency limit |
| Sequential independent tests | Wastes time, should run in parallel |
| No cleanup on failure | Leaves resources dangling |

### Performance Optimization

```yaml
# BAD: Sequential independent tests
jobs:
  test1:
    runs-on: ubuntu-latest
    steps:
      - run: yarn cypress run --spec test1.spec.ts
  test2:
    needs: test1  # Unnecessary dependency!
    runs-on: ubuntu-latest
    steps:
      - run: yarn cypress run --spec test2.spec.ts

# GOOD: Parallel independent tests
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        spec: [test1, test2, test3]
    steps:
      - run: yarn cypress run --spec ${{ matrix.spec }}.spec.ts
```

---

## Exercise: Create Sequential Workflow

### Task 1: Create three-stage pipeline

Create a workflow with:
1. Setup job (install + build)
2. API tests (needs setup)
3. UI tests (needs API tests)
4. Cleanup job (always runs after tests)

<details>
<summary>Solution</summary>

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn install
      - run: yarn build:ci
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: build

  api:
    needs: setup
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: build
      - run: yarn cypress run --spec "cypress/tests/api/*.spec.ts"

  ui:
    needs: api
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/download-artifact@v4
        with:
          name: build
          path: build
      - run: yarn cypress run --spec "cypress/tests/ui/*.spec.ts"

  cleanup:
    needs: [api, ui]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - run: echo "Cleanup resources"
```

</details>

---

## Next Section

Ready to move on? [Section 05: Cypress CI Integration](./05-cypress-ci-integration.md)
