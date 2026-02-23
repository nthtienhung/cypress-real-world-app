# SquashTM Integration

Auto-report Cypress test results to SquashTM.

---

## Quick Links

| Topic | File |
|-------|------|
| Concepts & Hierarchy | [01-concepts.md](01-concepts.md) |
| Test Execution Flow | [02-flow.md](02-flow.md) |
| Status Meanings | [03-statuses.md](03-statuses.md) |
| API Reference | [04-api-reference.md](04-api-reference.md) |
| Practice Exercises | [05-exercises.md](05-exercises.md) |
| SquashTM Capabilities | [06-capabilities.md](06-capabilities.md) |
| TODO List | [TODO.md](TODO.md) |

---

## Quick Start

```bash
# 1. Create test case in SquashTM (must have at least 1 step)
# 2. Add mapping to cypress/support/squash-mappings.ts
# 3. Run tests
npx cypress run --spec "cypress/tests/api/*.spec.ts"
# 4. Check SquashTM: Folder 4 → Campaigns → Latest run
```

---

## The 4 Key Files

| File | Purpose |
|------|---------|
| `cypress/support/squash-api.js` | SquashTM REST API client |
| `cypress/support/squash-tasks.js` | Node.js functions called by `cy.task()` |
| `cypress/support/squash-mappings.ts` | Map test names → SquashTM test case IDs |
| `cypress/support/e2e.ts` | Cypress hooks |
