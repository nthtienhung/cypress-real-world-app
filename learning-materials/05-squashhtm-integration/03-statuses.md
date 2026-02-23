# Status Meanings

## Status at Each Level

| Level | Possible Statuses | When Set |
|-------|-------------------|----------|
| **Campaign** | `IN_PROGRESS` → `FINISHED` | Start → End of tests |
| **Iteration** | `IN_PROGRESS` → `FINISHED` | Start → End of tests |
| **Execution** | `SUCCESS` / `FAILURE` / `BLOCKED` | Per test result |

## Execution Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| `SUCCESS` | 🟢 Green | Test passed |
| `FAILURE` | 🔴 Red | Test failed |
| `BLOCKED` | 🟡 Yellow | Test couldn't run |

## What Changes When Test Passes

| Entity | Before | After |
|--------|--------|-------|
| Campaign | IN_PROGRESS | **FINISHED** ✅ |
| Iteration | IN_PROGRESS | **FINISHED** ✅ |
| Test Case | (exists) | (no change - reusable) |
| Execution | (created) | **SUCCESS** ✅ |

## What Changes When Test Fails

| Entity | Before | After |
|--------|--------|-------|
| Campaign | IN_PROGRESS | **FINISHED** ✅ |
| Iteration | IN_PROGRESS | **FINISHED** ✅ |
| Test Case | (exists) | (no change - reusable) |
| Execution | (created) | **FAILURE** ❌ |

## Important: Test Case Never "Finishes"

Test cases are **definitions**, not runs. They're reused every time you run tests.

```
Run 1: Test Case #316 → Execution (SUCCESS)
Run 2: Test Case #316 → Execution (FAILURE)
Run 3: Test Case #316 → Execution (SUCCESS)
```

Test Case #316 is the same - only Executions change.

## Progress Bar Calculation

```
████████  66% (2/3 passed)
 ✅: 2 passed
 ❌: 1 failed
 ⏭️: 0 not run
```

Calculated from all executions in the iteration.
