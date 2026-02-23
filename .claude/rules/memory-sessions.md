# Memory: Sessions

## 2025-02-23: SquashTM Integration Deep Dive

### Accomplished
1. **Fixed duplicate campaign name bug** - added full timestamp to campaign names
2. **Fixed test plan item matching bug** - use `.find()` to match testCaseId instead of `[0]`
3. **Reorganized learning materials** - split into focused files (01-concepts.md through 06-capabilities.md)
4. **Clarified SquashTM concepts** - Test Case vs Execution, where to view results, status meanings
5. **Documented full integration flow** - from Cypress test to SquashTM execution

### Key Learnings
- **Test Case ≠ Execution**: Test cases are reusable definitions; executions are per-run results
- **View results in Iteration workspace**, not Test Case workspace (shows cached status)
- **Campaign/Iteration status**: Both marked FINISHED after tests complete
- **Duplicate name error**: Fixed by including time in campaign name

### Files Modified
- `cypress/support/e2e.ts` - campaign name with full timestamp
- `cypress/support/squash-tasks.js` - fixed test plan item matching
- `learning-materials/05-squashhtm-integration/` - reorganized into 6 focused files + TODO.md

### Created
- `learning-materials/05-squashhtm-integration/01-concepts.md`
- `learning-materials/05-squashhtm-integration/02-flow.md`
- `learning-materials/05-squashhtm-integration/03-statuses.md`
- `learning-materials/05-squashhtm-integration/04-api-reference.md`
- `learning-materials/05-squashhtm-integration/05-exercises.md`
- `learning-materials/05-squashhtm-integration/06-capabilities.md`
- `learning-materials/05-squashhtm-integration/TODO.md`
- `.claude/rules/memory-*.md` files

### Current Configuration
- SquashTM URL: https://squash-tm-dev-01.l0tt0.online
- Folder ID: 4
- Username: hung.nguyen
- Campaign: Auto-created per run with timestamp
- Mapped tests: 2 (TC-1: 316, TC-2: 317)
