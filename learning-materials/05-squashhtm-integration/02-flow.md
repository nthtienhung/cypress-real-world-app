# Test Execution Flow

## Timeline: What Happens When Tests Run

```
TIME    │ Local Cypress                        │ SquashTM
────────┼───────────────────────────────────────┼───────────────────────────────────
T+0s    │ before() hook                        │
        │ → init (login)                       │ → Session created
        │ → createCampaign                     │ → Campaign: IN_PROGRESS
        │ → createIteration                    │ → Iteration: IN_PROGRESS
        │                                       │
        │ Test 1 runs... ✅                     │
        │ afterEach() → report                  │ → Execution: SUCCESS
        │                                       │
        │ Test 2 runs... ❌                     │
        │ afterEach() → report                  │ → Execution: FAILURE
        │                                       │
        │ after() hook → finish                 │ → Iteration: FINISHED
        │                                       │ → Campaign: FINISHED
```

## Code Flow (Per Test)

```javascript
// When test passes:
afterEach() → cy.task("squash:report", { status: "SUCCESS" })
    ↓
// squash-tasks.js
1. addTestCaseToIteration(iterationId, testCaseId)
   → POST /iterations/{id}/test-plan

2. getIterationTestPlan(iterationId)
   → GET /iterations/{id}/test-plan

3. createExecution(testPlanItemId)
   → POST /test-plan-items/{id}/executions

4. updateExecutionStatus(executionId, "SUCCESS")
   → PATCH /executions/{id}
```

## What You See in SquashTM

**Folder 4** → **Campaign "Auto-2024-02-23"** → **Iteration "Run 123"**

```
Test Case      │ Execution Status
────────────────│─────────────────
TC-1: gets...│ SUCCESS ✅
TC-2: creates..│ FAILURE ❌
```

## Where to Check Results (Important!)

**Use these URLs for accurate results**:

| What You Want | URL Pattern |
|---------------|-------------|
| Campaign results | `/campaign-workspace/campaign/{id}/dashboard` |
| Iteration results | `/campaign-workspace/iteration/{id}/test-plan?anchor=plan-exec` |
| Execution details | `/campaign-workspace/execution/{id}/execution` |

### ⚠️ Do NOT Use Test Case Workspace for Results

**URL**: `/test-case-workspace/test-case/{id}/steps`

This view shows **cached/outdated** "Last Execution" status. It's for editing test cases, not viewing results.

| View | Purpose |
|------|---------|
| Test Case Workspace | Edit test case definition |
| Iteration/Execution Workspace | **View actual test results** ✅ |

**The Test Case "Last Execution" may show old status** - this is normal SquashTM behavior. Always check the Iteration view for real results.

## Example: 3 Tests Run

| Test | Local Result | SquashTM Status |
|------|--------------|-----------------|
| TC-1 | ✅ Pass | SUCCESS (green) |
| TC-2 | ✅ Pass | SUCCESS (green) |
| TC-3 | ❌ Fail | FAILURE (red) |

**Progress Bar**: `███░░░░ 66% (2/3 passed)`
