# Agent Guidelines

## Commands

```bash
yarn dev                    # Start dev servers
yarn build                  # Build production
yarn types                  # Type check
yarn lint                   # Lint + format check
yarn prettier               # Auto-format
yarn test:unit              # Unit tests (watch)
yarn test:unit:ci           # Unit tests (CI)
yarn cypress:run            # E2E tests headless
yarn cypress:run --spec "cypress/tests/ui/auth.spec.ts"  # Single test
yarn start:api              # Backend only
```

## Code Style

**Keep code and documentation concise.** Avoid unnecessary comments, verbose explanations, and redundant text.

### Imports

- Group: React/libs → internal → types
- Use absolute imports from `src/`
- Prefer named exports
- Use `lodash/fp` for functional utils

### TypeScript

- Strict mode - all code typed
- Prefer `interface` over `type`
- Use discriminated unions for XState events
- `!` and `@ts-ignore` allowed sparingly

### Naming

- Components: PascalCase (`SignInForm.tsx`)
- Utilities: camelCase (`useAuth.ts`)
- Machines: camelCase + "Machine" suffix
- Backend routes: kebab-case (`user-routes.ts`)
- XState events: UPPER_SNAKE_CASE

### Formatting

- 100 char line width
- ES5 trailing commas
- Auto-format on save

### XState

- V4 machines only
- Co-locate logic with types
- Use `assign()` for updates
- Explicit state transitions

### Error Handling

- Backend: `express-validator`
- Frontend: XState `onError`
- Use `httpClient` for API calls

### Backend

- Routes in `backend/` directory
- Export Express router instances
- async/await with try-catch
- Database: LowDB in `data/database.json`

### Testing

- Unit: Vitest + jsdom
- E2E: Cypress in `cypress/tests/`
- Custom commands in `cypress/support/commands.ts`

### Environment

- Frontend: `VITE_*` prefix
- Backend: standard `process.env`
- Local: `.env.local` (gitignored)

### Git

- Pre-push hook runs `yarn types`
- Run `yarn test:unit:ci` and `yarn lint` before commit
