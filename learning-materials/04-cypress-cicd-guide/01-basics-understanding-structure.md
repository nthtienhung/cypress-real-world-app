# Section 01: Basics - Understanding Structure

## Learning Objectives

By the end of this section, you will understand:

- How to read a GitHub Actions workflow YAML file
- The structure of jobs, steps, and triggers
- Cypress CLI commands for running tests
- How your current `main.yml` workflow works

---

## Part 1: GitHub Actions Workflow Structure

### Basic Workflow Anatomy

```yaml
name: Workflow Name                    # Human-readable name

on:                                    # Triggers (when to run)
  push:
    branches: [main]

jobs:                                  # One or more jobs
  job-name:                            # Job ID
    runs-on: ubuntu-latest             # Runner type
    steps:                             # Steps to execute
      - name: Step name
        run: command
```

### Key Components Explained

| Component | Description | Example |
|-----------|-------------|---------|
| `name` | Workflow display name | `name: Cypress Tests` |
| `on` | Triggers that start the workflow | `on: push`, `on: schedule`, `on: workflow_dispatch` |
| `jobs` | Collection of jobs to run | Jobs run in parallel by default |
| `runs-on` | The runner environment | `ubuntu-latest`, `windows-latest`, `macos-latest` |
| `steps` | Sequential actions within a job | `uses:`, `run:`, `with:` |
| `needs` | Job dependency | `needs: install` (waits for install job) |

---

## Part 2: Reading Your Current Workflow

Your existing `.github/workflows/main.yml` has this structure:

```yaml
name: Cypress Tests

on:
  push:
    branches-ignore:
      - "renovate/**"

jobs:
  # Job 1: Install and build
  install:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Install dependencies
      - Run lint, type check, unit tests
      - Build the application
      - Save build artifact

  # Job 2-5: UI tests (different browsers/devices)
  ui-chrome-tests:
    needs: install           # Waits for install job
    strategy:
      matrix:
        containers: [1,2,3,4,5]  # 5 parallel runs
    steps:
      - Download build artifact
      - Run Cypress tests

  ui-chrome-mobile-tests:
    needs: install
    # ... similar structure for mobile viewport

  ui-firefox-tests:
    needs: install
    # ... similar structure for Firefox

  ui-firefox-mobile-tests:
    needs: install
    # ... similar structure for Firefox mobile
```

### Key Patterns in Your Workflow

1. **Artifact sharing**: Build once, reuse across jobs
2. **Parallel execution**: Matrix strategy for faster runs
3. **Job dependencies**: Using `needs` keyword
4. **Cypress GitHub Action**: Using `cypress-io/github-action@v6`

---

## Part 3: Cypress CLI Commands

### Basic Commands

| Command | Description |
|---------|-------------|
| `cypress run` | Run all tests headlessly |
| `cypress open` | Open Cypress Test Runner |
| `cypress run --spec <path>` | Run specific spec file |
| `cypress run --spec "<pattern>"` | Run specs matching pattern |

### Common Patterns

```bash
# Run all tests
yarn cypress run

# Run specific file
yarn cypress run --spec cypress/tests/api/api-users.spec.ts

# Run all API tests
yarn cypress run --spec "cypress/tests/api/*.spec.ts"

# Run all UI tests
yarn cypress run --spec "cypress/tests/ui/*.spec.ts"

# Run with mobile viewport
yarn cypress run --config '{"e2e":{"viewportWidth":375,"viewportHeight":667}}'

# Run specific browser
yarn cypress run --browser chrome
yarn cypress run --browser firefox
yarn cypress run --browser edge

# Run with parallelization (requires Cypress Cloud)
yarn cypress run --parallel --record --group "CI Group"

# Run specific test file by grep
yarn cypress run --spec "cypress/tests/ui/*.spec.ts" --env grep="Login"
```

---

## Part 4: Common GitHub Actions for Cypress

### Cypress Official Action

```yaml
- uses: cypress-io/github-action@v6
  with:
    # Required
    start: yarn start           # Command to start app
    wait-on: "http://localhost:3000"

    # Optional
    browser: chrome             # chrome, firefox, edge, electron
    spec: cypress/tests/ui/*    # Which specs to run
    config: '{}'                # Override Cypress config
    record: true                # Record to Cypress Cloud
    parallel: true              # Parallel execution
    group: "UI - Chrome"        # Group name for recording
```

### Checkout Action

```yaml
- name: Checkout
  uses: actions/checkout@v4
```

### Artifact Actions

```yaml
# Save artifact
- name: Save build folder
  uses: actions/upload-artifact@v4
  with:
    name: build
    path: build

# Download artifact
- name: Download build folders
  uses: actions/download-artifact@v4
  with:
    name: build
    path: build
```

---

## Part 5: Environment Variables & Secrets

### Using Environment Variables

```yaml
- uses: cypress-io/github-action@v6
  env:
    CYPRESS_PROJECT_ID: ${{ secrets.CYPRESS_PROJECT_ID }}
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    DEBUG: "cypress:server:args"
```

### Setting Secrets in GitHub

1. Go to repository Settings
2. Navigate to Secrets and Variables → Actions
3. Click "New repository secret"
4. Add name and value

---

## Exercise: Understanding Your Current Workflow

### Task 1: Identify Components

Looking at your `.github/workflows/main.yml`, identify:

1. How many jobs are defined?
2. Which jobs use `needs`? What do they depend on?
3. What browsers are tested?
4. How many parallel containers run per job?

<details>
<summary>Solution</summary>

1. **5 jobs**: install, ui-chrome-tests, ui-chrome-mobile-tests, ui-firefox-tests, ui-firefox-mobile-tests
2. **4 jobs use `needs: install`**: All test jobs wait for the install job
3. **Browsers**: Chrome and Firefox
4. **5 parallel containers per job**: `containers: [1, 2, 3, 4, 5]`

</details>

---

### Task 2: Cypress CLI Equivalents

What Cypress CLI command would run the same tests as `ui-chrome-tests`?

<details>
<summary>Solution</summary>

```bash
yarn cypress run \
  --browser chrome \
  --spec "cypress/tests/ui/*" \
  --record \
  --parallel \
  --group "UI - Chrome"
```

</details>

---

## Next Section

Ready to move on? [Section 02: Scheduled Workflows](./02-scheduled-workflows.md)
