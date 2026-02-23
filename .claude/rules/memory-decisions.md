# Memory: Decisions

## Past Choices for Consistency

### 2025-02-23: SquashTM Integration Setup

| Decision | Rationale |
|----------|-----------|
| **Auto-create campaigns** in folder 4 | Avoid duplicate name errors, one campaign per run |
| **Campaign name with timestamp** | `Auto-YYYY-MM-DDTHH-mm-ss-SSSZ` for uniqueness |
| **Use `cy.task()` for API calls** | Browser can't call external APIs (CORS) |
| **File-based TODO list** | Persists across sessions, easier to manage |
| **Split learning materials** | One concept per file (01-concepts.md, 02-flow.md, etc.) |
| **View results in Iteration workspace** | Test Case workspace shows cached/outdated status |

### Code Decisions

| File | Decision |
|------|----------|
| `squash-tasks.js` line 32 | Use `.find()` to match testCaseId, not `[0]` |
| `e2e.ts` | FOLDER_ID = 4, campaign auto-created per run |
| `squash-mappings.ts` | Manual test name → test case ID mapping |

### postponed
| Task | Status |
|------|--------|
| Automate test case creation via API | TODO: Future enhancement |
| Add error handling for SquashTM failures | TODO: Future enhancement |
| Remove hardcoded credentials | TODO: Future enhancement |
