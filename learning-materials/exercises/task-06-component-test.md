# Task 6: Component Test

**Goal:** Test a React component in isolation.

## What to Do

1. Pick a component from `src/components/` (e.g., `TransactionItem.tsx`)
2. Create `src/components/TransactionItem.cy.tsx`
3. Write tests for:
   - Component renders with props
   - Click handler works
   - Different states (loading, error, success)

## Hints

- Use `cy.mount()` to render component
- Pass props directly to component
- Mock any API calls with `cy.intercept()`

## Run It

```bash
yarn cypress:run:component
```

## Check Your Work

Test passes when:

- Component renders correctly
- User interactions work
- All states tested

---

**Move to Task 7 when done.**
