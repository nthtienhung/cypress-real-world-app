# SquashTM Capabilities

## Core Features (What Programmers Use)

| Area | Purpose | API Endpoint |
|------|---------|--------------|
| **Test Cases** | Define test steps | `/test-cases` |
| **Campaigns** | Organize test runs | `/campaigns` |
| **Iterations** | Individual test run | `/campaigns/{id}/iterations` |
| **Executions** | Record pass/fail | `/executions` |
| **Test Plan** | Assign tests to runs | `/iterations/{id}/test-plan` |

## Test Case Management

```
Test Case
├── Name, reference, description
├── Steps (action + expected result)
├── Datasets (data-driven testing)
└── Attachments (files, screenshots)
```

## Campaign Structure

```
Campaign Folder
└── Campaign
    └── Iteration
        ├── Test Plan (assigned test cases)
        └── Executions (results)
```

## Execution Status

| Status | Color | Meaning |
|--------|-------|---------|
| `SUCCESS` | 🟢 | Test passed |
| `FAILURE` | 🔴 | Test failed |
| `BLOCKED` | 🟡 | Test couldn't run |

## Other Features (Less Common)

| Feature | Purpose |
|----------|---------|
| **Requirements** | Link tests to requirements (traceability) |
| **Datasets** | Run same test with different data |
| **Test Suites** | Quick test groups |
| **Attachments** | Upload screenshots, logs |
| **Parameters** | Custom project fields |
| **Action Words** | Keyword-driven testing (Ultimate license) |

## What You're Using vs Available

| Feature | Status |
|---------|--------|
| Create Campaign | ✅ Auto |
| Create Iteration | ✅ Auto |
| Report Execution | ✅ Auto |
| Create Test Case | ❌ Manual (TODO: automate) |
| Attachments | ❌ Not using |
| Datasets | ❌ Not using |
| Requirements | ❌ Not using |

## Focus Areas

For now, master:
1. **Test Cases** → Define tests
2. **Campaigns/Iterations** → Organize runs
3. **Executions** → Record results

Everything else is optional.
