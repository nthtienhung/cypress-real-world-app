# Section 05: Cypress CI Integration

## Learning Objectives

By the end of this section, you will understand:

- How to set up Cypress Cloud recording
- How to configure parallel execution
- How to create complete production-ready workflows
- Best practices for Cypress in CI/CD

---

## Part 1: Cypress Cloud Setup

### What is Cypress Cloud?

Cypress Cloud (formerly Cypress Dashboard) provides:
- Test recording and history
- Parallel execution
- Flake detection
- Video recordings and screenshots
- Test analytics and insights

### Setting Up Cypress Cloud

1. **Create an account** at https://cloud.cypress.io

2. **Create a project** and get your credentials:
   - `CYPRESS_PROJECT_ID`
   - `CYPRESS_RECORD_KEY`

3. **Add secrets to GitHub**:
   - Go to repository Settings → Secrets and Variables → Actions
   - Add `CYPRESS_PROJECT_ID`
   - Add `CYPRESS_RECORD_KEY`

4. **Configure project ID** in `cypress.config.ts`:

```typescript
export default defineConfig({
  projectId: "your-project-id",  // Already set in your config
  // ...
});
```

---

## Part 2: Recording Test Results

### Basic Recording Configuration

```yaml
- uses: cypress-io/github-action@v6
  with:
    record: true  # Enable recording
  env:
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

### Recording with Groups

Groups help organize test runs:

```yaml
- uses: cypress-io/github-action@v6
  with:
    record: true
    group: "Chrome - Desktop"  # Group name
    parallel: false  # Sequential within group
  env:
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

### Recording with Tags

```yaml
- uses: cypress-io/github-action@v6
  with:
    record: true
    group: "PR-${{ github.event.number }}"
    tag: "${{ github.ref_name }}"  # Branch name
  env:
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

---

## Part 3: Parallel Execution

### Why Parallel Execution?

- **Faster results**: 1 hour of tests → 12 minutes with 5 containers
- **Better resource usage**: Utilize multiple machines
- **Quick feedback**: Get results faster

### Setting Up Parallel Execution

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false  # Don't cancel other jobs if one fails
      matrix:
        containers: [1, 2, 3, 4, 5]  # 5 parallel machines
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          record: true
          parallel: true  # Enable parallel
          group: "UI Tests - Parallel"
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Parallel with Multiple Browsers

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chrome, firefox, edge]
        shard: [1, 2, 3, 4, 5]  # 5 shards per browser
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        with:
          browser: ${{ matrix.browser }}
          record: true
          parallel: true
          group: "Tests - ${{ matrix.browser }}"
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

This creates 15 jobs (3 browsers × 5 shards).

---

## Part 4: Complete Production Workflow

### Full-Featured Workflow

```yaml
name: Cypress CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 9 AM Vietnam time
    - cron: '0 2 * * 1'  # Weekly on Monday
  workflow_dispatch:
    inputs:
      suite:
        description: 'Test suite'
        type: choice
        options: [smoke, regression, api-only, ui-only]
        default: regression
      parallel:
        description: 'Run in parallel'
        type: boolean
        default: true

jobs:
  # Job 1: Setup and validation
  setup:
    name: Setup & Validate
    runs-on: ubuntu-latest
    container:
      image: cypress/browsers:22.20.0
      options: --user 1001
    outputs:
      cache-key: ${{ steps.cache.outputs.key }}
      test-type: ${{ steps.determine.outputs.test-type }}
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Determine test type
        id: determine
        run: |
          if [ "${{ github.event_name }}" == "schedule" ]; then
            # Check if Monday (day of week = 1)
            DAY_OF_WEEK=$(date +%u)
            if [ "$DAY_OF_WEEK" == "1" ]; then
              echo "test-type=regression" >> $GITHUB_OUTPUT
            else
              echo "test-type=smoke" >> $GITHUB_OUTPUT
            fi
          else
            echo "test-type=${{ inputs.suite }}" >> $GITHUB_OUTPUT
          fi

      - name: Cache node modules
        id: cache
        uses: actions/cache@v4
        with:
          path: node_modules
          key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}

      - name: Install dependencies
        if: steps.cache.outputs.cache-hit != 'true'
        uses: cypress-io/github-action@v6
        with:
          runTests: false

      - name: Run validations
        run: |
          yarn types
          yarn lint
          yarn test:unit:ci

      - name: Build application
        run: yarn build:ci

      - name: Save build folder
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: build
          retention-days: 1

  # Job 2: API tests
  api-tests:
    name: API Tests
    needs: setup
    if: needs.setup.outputs.test-type != 'ui-only'
    runs-on: ubuntu-latest
    container:
      image: cypress/browsers:22.20.0
      options: --user 1001
    strategy:
      fail-fast: false
      matrix:
        containers: [1, 2, 3]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: build

      - name: Run API tests
        uses: cypress-io/github-action@v6
        with:
          record: true
          parallel: true
          group: "API Tests"
          spec: "cypress/tests/api/*.spec.ts"
          config: '{"baseUrl":""}'
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Job 3: UI Chrome tests
  ui-chrome:
    name: UI - Chrome
    needs: [setup, api-tests]
    if: needs.setup.outputs.test-type != 'api-only'
    timeout-minutes: 30
    runs-on: ubuntu-latest
    container:
      image: cypress/browsers:22.20.0
      options: --user 1001
    strategy:
      fail-fast: false
      matrix:
        containers: [1, 2, 3, 4, 5]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: build

      - name: Run UI tests on Chrome
        uses: cypress-io/github-action@v6
        with:
          start: yarn start:ci
          wait-on: "http://localhost:3000"
          wait-on-timeout: 120
          browser: chrome
          record: true
          parallel: true
          group: "UI - Chrome"
          spec: |
            cypress/tests/ui/*.spec.ts
          config-file: cypress.config.ts
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Job 4: UI Firefox tests
  ui-firefox:
    name: UI - Firefox
    needs: [setup, api-tests]
    if: needs.setup.outputs.test-type != 'api-only'
    timeout-minutes: 30
    runs-on: ubuntu-latest
    container:
      image: cypress/browsers:22.20.0
      options: --user 1001
    strategy:
      fail-fast: false
      matrix:
        containers: [1, 2, 3, 4, 5]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: build

      - name: Run UI tests on Firefox
        uses: cypress-io/github-action@v6
        with:
          start: yarn start:ci
          wait-on: "http://localhost:3000"
          wait-on-timeout: 120
          browser: firefox
          record: true
          parallel: true
          group: "UI - Firefox"
          spec: |
            cypress/tests/ui/*.spec.ts
          config-file: cypress.config.ts
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Job 5: Report results
  report:
    name: Report Results
    needs: [setup, api-tests, ui-chrome, ui-firefox]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Check results
        run: |
          echo "Setup: ${{ needs.setup.result }}"
          echo "API Tests: ${{ needs.api-tests.result }}"
          echo "UI Chrome: ${{ needs.ui-chrome.result }}"
          echo "UI Firefox: ${{ needs.ui-firefox.result }}"

          if [ "${{ needs.setup.result }}" != "success" ] || \
             [ "${{ needs.api-tests.result }}" != "success" ] || \
             [ "${{ needs.ui-chrome.result }}" != "success" ] || \
             [ "${{ needs.ui-firefox.result }}" != "success" ]; then
            echo "❌ Some jobs failed"
            exit 1
          else
            echo "✅ All jobs passed"
          fi
```

---

## Part 5: Smoke Test Workflow (Lightweight)

For quick PR validation:

```yaml
name: Cypress Smoke Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  smoke:
    name: Smoke Tests
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - name: Install
        uses: cypress-io/github-action@v6
        with:
          runTests: false

      - name: Run smoke tests
        uses: cypress-io/github-action@v6
        with:
          start: yarn start:ci
          wait-on: "http://localhost:3000"
          browser: chrome
          spec: |
            cypress/tests/ui/auth.spec.ts
            cypress/tests/api/api-users.spec.ts
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Part 6: Best Practices

### DO ✅

| Practice | Reason |
|----------|--------|
| Use `fail-fast: false` | See all test failures, not just first |
| Set appropriate timeouts | Prevent hanging jobs |
| Use artifacts for build | Reuse builds across jobs |
| Record to Cypress Cloud | Get test history and flake detection |
| Use parallel for full suite | Faster results |
| Use groups for organization | Easier to find test runs |
| Always cleanup on failure | Don't leave resources dangling |

### DON'T ❌

| Anti-pattern | Reason |
|--------------|--------|
| No timeout | Jobs hang forever |
| fail-fast: true (for CI) | Cancels other tests, hides failures |
| Not caching dependencies | Wastes time reinstalling |
| No retries | Flaky tests fail CI |
| Recording without parallel | Wastes recording quota |

### Performance Tips

```yaml
# ✅ GOOD: Cache dependencies
- name: Cache
  uses: actions/cache@v4
  with:
    path: |
      node_modules
      ~/.cache/Cypress
    key: ${{ runner.os }}-node-${{ hashFiles('**/yarn.lock') }}

# ✅ GOOD: Build once, reuse
jobs:
  build:
    # Build and save artifact
  tests:
    needs: build
    # Download and test

# ❌ BAD: Build in every job
jobs:
  chrome:
    steps:
      - run: yarn build  # Redundant
      - run: yarn cypress run
  firefox:
    steps:
      - run: yarn build  # Redundant
      - run: yarn cypress run
```

---

## Part 7: Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Tests timeout locally but not in CI | Increase `wait-on-timeout` |
| Cypress can't find app | Check `baseUrl` and `wait-on` |
| Parallel tests not load balanced | Ensure `record: true` is set |
| Jobs fail intermittently | Add retries, check flaky tests |
| Out of memory errors | Reduce parallel containers |

### Debug Mode

```yaml
- uses: cypress-io/github-action@v6
  with:
    # ... other config
  env:
    DEBUG: "cypress:*"  # Enable debug logs
```

---

## Exercise: Create Complete Workflow

### Task: Create production-ready workflow

Create a workflow that includes:
1. Setup job with caching
2. API tests (3 parallel containers)
3. UI tests on Chrome (5 parallel containers)
4. Conditional report job
5. Proper error handling

<details>
<summary>Solution</summary>

See the "Complete Production Workflow" example above in Part 4.

</details>

---

## Summary

You've now learned:

1. ✅ GitHub Actions workflow structure
2. ✅ Scheduled jobs with cron
3. ✅ Flexible test execution by suite
4. ✅ Sequential execution with dependencies
5. ✅ Cypress Cloud recording and parallel execution

## Next Steps

1. Apply these patterns to your project
2. Configure Cypress Cloud if not already done
3. Test the workflow manually first
4. Monitor and optimize based on results

## Additional Resources

- [Cypress GitHub Action Documentation](https://github.com/cypress-io/github-action)
- [Cypress Cloud Documentation](https://docs.cypress.io/cloud)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**End of Guide** 🎉
