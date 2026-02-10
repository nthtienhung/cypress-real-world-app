# Section 02: Scheduled Workflows

## Learning Objectives

By the end of this section, you will understand:

- How to use cron syntax for scheduling
- How to create jobs with different schedules
- How to manually trigger workflows
- Best practices for scheduled test runs

---

## Part 1: Workflow Triggers

### Available Triggers

| Trigger | Description | Example Use Case |
|---------|-------------|------------------|
| `push` | Run on git push | PR validation, main branch protection |
| `pull_request` | Run on PR creation/update | Pre-merge validation |
| `schedule` | Run on cron schedule | Nightly builds, weekly regression |
| `workflow_dispatch` | Manual trigger | On-demand test runs |
| `repository_dispatch` | Triggered by API | External systems integration |

### Combining Triggers

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:     # Allow manual trigger
```

---

## Part 2: Cron Syntax

### Cron Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, 0 = Sunday)
│ │ │ │ │
* * * * *
```

### Common Cron Examples

| Pattern | Description | Cron Expression |
|---------|-------------|-----------------|
| Every 5 minutes | Runs frequently | `*/5 * * * *` |
| Hourly | Every hour | `0 * * * *` |
| Daily at midnight | Every day at 00:00 | `0 0 * * *` |
| Daily at 2 AM | Good for overnight runs | `0 2 * * *` |
| Weekly (Monday 9 AM) | Start of week testing | `0 9 * * 1` |
| Weekly (Friday 5 PM) | Before weekend | `0 17 * * 5` |
| Monthly (1st at 3 AM) | Monthly regression | `0 3 1 * *` |
| Monday to Friday at 8 AM | Weekday smoke tests | `0 8 * * 1-5` |

### Important Notes

⚠️ **GitHub Actions Limitations:**
- Minimum interval: **5 minutes**
- Scheduled runs may be delayed during high load
- Times are in **UTC** (not your local timezone)

🌍 **Timezone Tips:**
- Vietnam (UTC+7): Subtract 7 hours from desired time
- Example: 9 AM Vietnam time = `0 2 * * *` (2 AM UTC)

---

## Part 3: Creating Scheduled Jobs

### Example: Daily Smoke Tests + Weekly Regression

```yaml
name: Scheduled Cypress Tests

on:
  # Daily smoke tests at 9 AM Vietnam time (2 AM UTC)
  schedule:
    - cron: '0 2 * * *'  # Daily

  # Weekly regression every Monday at 9 AM Vietnam time
    - cron: '0 2 * * 1'  # Every Monday

  # Allow manual trigger
  workflow_dispatch:

jobs:
  smoke-tests:
    # Runs every day
    if: github.event.schedule == '0 2 * * *'
    runs-on: ubuntu-latest
    steps:
      - name: Quick smoke tests
        run: yarn cypress run --spec "cypress/tests/ui/auth.spec.ts"

  regression-tests:
    # Runs only on Mondays
    if: github.event.schedule == '0 2 * * 1'
    runs-on: ubuntu-latest
    steps:
      - name: Full regression
        run: yarn cypress run
```

---

## Part 4: Using Conditional Execution

### Method 1: Using `if` with Cron Pattern

```yaml
jobs:
  daily-job:
    if: github.event_name == 'schedule' && github.event.schedule == '0 2 * * *'
    runs-on: ubuntu-latest
    steps:
      - run: echo "Running daily job"
```

### Method 2: Using Workflow Inputs

```yaml
on:
  workflow_dispatch:
    inputs:
      test_type:
        description: 'Type of tests to run'
        required: true
        type: choice
        options:
          - smoke
          - regression
          - api-only
          - ui-only

jobs:
  tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run based on selection
        run: |
          case "${{ inputs.test_type }}" in
            smoke) yarn cypress run --spec "cypress/tests/ui/auth.spec.ts" ;;
            regression) yarn cypress run ;;
            api-only) yarn cypress run --spec "cypress/tests/api/*.spec.ts" ;;
            ui-only) yarn cypress run --spec "cypress/tests/ui/*.spec.ts" ;;
          esac
```

---

## Part 5: Complete Scheduled Workflow Example

```yaml
name: Cypress Scheduled Tests

on:
  # Daily smoke tests at 9 AM Vietnam time (2 AM UTC)
  schedule:
    - cron: '0 2 * * *'

  # Weekly full regression every Monday at 9 AM Vietnam time (2 AM UTC)
    - cron: '0 2 * * 1'

  # Manual trigger with options
  workflow_dispatch:
    inputs:
      suite:
        description: 'Test suite to run'
        required: false
        default: 'all'
        type: choice
        options:
          - smoke
          - regression
          - api-only
          - ui-only

jobs:
  determine-job:
    runs-on: ubuntu-latest
    outputs:
      test-type: ${{ steps.set-type.outputs.test-type }}
    steps:
      - id: set-type
        run: |
          if [ "${{ github.event_name }}" == "schedule" ]; then
            # Check if it's Monday (day of week = 1)
            DAY_OF_WEEK=$(date +%u)
            if [ "$DAY_OF_WEEK" == "1" ]; then
              echo "test-type=regression" >> $GITHUB_OUTPUT
            else
              echo "test-type=smoke" >> $GITHUB_OUTPUT
            fi
          else
            echo "test-type=${{ inputs.suite }}" >> $GITHUB_OUTPUT
          fi

  smoke-tests:
    needs: determine-job
    if: needs.determine-job.outputs.test-type == 'smoke'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run smoke tests
        run: yarn cypress run --spec "cypress/tests/ui/auth.spec.ts"

  regression-tests:
    needs: determine-job
    if: needs.determine-job.outputs.test-type == 'regression'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run full regression
        run: yarn cypress run

  api-tests:
    needs: determine-job
    if: needs.determine-job.outputs.test-type == 'api-only'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run API tests only
        run: yarn cypress run --spec "cypress/tests/api/*.spec.ts"

  ui-tests:
    needs: determine-job
    if: needs.determine-job.outputs.test-type == 'ui-only'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run UI tests only
        run: yarn cypress run --spec "cypress/tests/ui/*.spec.ts"
```

---

## Part 6: Best Practices

### DO ✅

| Practice | Reason |
|----------|--------|
| Use appropriate intervals | Don't overload CI resources |
| Combine schedule with manual trigger | Allows on-demand runs |
| Use conditional execution | Skip unnecessary jobs |
| Monitor scheduled run durations | Ensure jobs complete before next run |
| Set appropriate timeouts | Prevent hanging jobs |

### DON'T ❌

| Anti-pattern | Reason |
|--------------|--------|
| Scheduling every minute | Wastes resources, may hit limits |
| Ignoring timezone | Tests run at wrong time |
| No timeout configuration | Jobs may hang indefinitely |
| Not checking previous run status | May run duplicate failed jobs |

### Timeout Configuration

```yaml
jobs:
  tests:
    timeout-minutes: 30  # Kill job after 30 minutes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: cypress-io/github-action@v6
        timeout-minutes: 15  # Per-step timeout
```

---

## Exercise: Create Your Scheduled Workflow

### Task 1: Create a daily smoke test

Create a workflow that:
- Runs every day at 10 AM Vietnam time
- Runs only authentication tests
- Times out after 15 minutes

<details>
<summary>Solution</summary>

```yaml
name: Daily Smoke Tests

on:
  schedule:
    - cron: '0 3 * * *'  # 10 AM Vietnam = 3 AM UTC

jobs:
  smoke:
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run auth smoke tests
        run: yarn cypress run --spec "cypress/tests/ui/auth.spec.ts"
```

</details>

---

### Task 2: Add manual trigger

Modify the workflow to also allow manual triggering with a choice between "smoke" and "regression".

<details>
<summary>Solution</summary>

```yaml
on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:
    inputs:
      test_type:
        type: choice
        options: [smoke, regression]
        default: smoke

jobs:
  smoke:
    if: |
      (github.event_name == 'schedule') ||
      (github.event_name == 'workflow_dispatch' && inputs.test_type == 'smoke')
    timeout-minutes: 15
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn cypress run --spec "cypress/tests/ui/auth.spec.ts"

  regression:
    if: github.event_name == 'workflow_dispatch' && inputs.test_type == 'regression'
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: yarn cypress run
```

</details>

---

## Next Section

Ready to move on? [Section 03: Flexible Test Execution](./03-flexible-test-execution.md)
