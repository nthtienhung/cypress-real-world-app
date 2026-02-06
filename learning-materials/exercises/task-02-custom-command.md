# Task 2: Custom Login Command

**Goal:** Create a reusable `cy.loginUI()` command for UI-based login.

## What to Do

1. Open `cypress/support/commands.ts`
2. Add a new command:
   ```typescript
   Cypress.Commands.add("loginUI", (username: string, password: string) => {
     // Your code here
   });
   ```
3. Update `cypress/global.d.ts` to add TypeScript types
4. Use it in a test

## Hints

- Look at existing `cy.login()` for inspiration (it uses API)
- Your version should use UI interactions (type, click)
- Add proper TypeScript declarations

## Run It

```bash
yarn cypress:open
# Run any test that uses your new command
```

## Check Your Work

Command works when you can do:

```typescript
cy.loginUI("Heath93", "s3cret");
cy.location("pathname").should("equal", "/");
```

---

**Move to Task 3 when done.**
