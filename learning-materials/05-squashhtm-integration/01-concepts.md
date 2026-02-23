# SquashTM Concepts & Hierarchy

## The Data Model

```
Campaign Folder (e.g., ID: 4)
 └── Campaign (e.g., "Auto-2024-02-23")
      └── Iteration (e.g., "Run 1737641234567")
           └── Test Plan Item
               ├── Test Case (e.g., #316 - the definition)
               └── Execution (the result: SUCCESS/FAILURE)
```

## Key Distinction: Test Case vs Execution

| Test Case | Execution |
|-----------|-----------|
| The **definition** of your test | The **result** of one run |
| Reusable across runs | One execution per run |
| Has steps (e.g., "Call API", "Verify response") | Has status (SUCCESS/FAILURE) |
| Never "finished" | Created and completed per run |

## Finding IDs in SquashTM UI

| What | How to Find ID |
|------|---------------|
| Campaign Folder | Open folder → URL: `/campaign-folders/4/content` |
| Campaign | Open campaign → URL: `/campaigns/123/dashboard` |
| Test Case | Open test case → URL: `/test-cases/316/info` |
| Iteration | Open iteration → URL: `/iterations/789/executions` |

## Current Configuration

```typescript
// cypress/support/e2e.ts
const FOLDER_ID = 4;  // Campaigns auto-created here
```

Every test run creates a **new campaign** in folder 4 with name `Auto-YYYY-MM-DD`.
