# Frontend Learning Guide

## Quick Start

```bash
yarn start:react    # Start frontend only
yarn dev            # Frontend + backend
```

## Architecture

```
src/
├── components/       # Reusable UI components
├── containers/       # Page-level components
├── models/          # TypeScript types
├── utils/           # Helper functions
├── machines/        # XState state machines
└── index.tsx        # App entry point
```

## Key Concepts (The Tricky Parts)

### 1. State Management (XState)

Located in `src/machines/`:

- `authMachine.ts` - Login/logout flow
- `bankAccountsMachine.ts` - Bank account CRUD
- `createTransactionMachine.ts` - Payment flow

Access in components:

```typescript
const [state, send] = useMachine(authMachine);
```

### 2. Routing

React Router v5 with declarative routing:

```typescript
<Switch>
  <Route path="/signin" component={SignIn} />
  <PrivateRoute path="/" component={Home} />
</Switch>
```

### 3. Data Fetching

Uses Apollo Client for GraphQL:

```typescript
const { data, loading } = useQuery(QUERY);
const [mutate] = useMutation(MUTATION);
```

### 4. Forms

Formik + Yup for validation:

```typescript
<Formik
  initialValues={{ username: '' }}
  validationSchema={validationSchema}
  onSubmit={handleSubmit}
>
```

### 5. Styling

Material-UI (MUI) v5:

- Components imported from `@mui/material`
- Custom styles with `styled()` API
- Theme customization in theme provider

## Component Types

### Presentational (components/)

Pure UI, no business logic. Example: `TransactionItem.tsx`

### Container (containers/)

Connect to state, handle data. Example: `TransactionsContainer.tsx`

## Data Test Attributes

For testing, elements have `data-test` attributes:

```html
<button data-test="signup-submit">Sign Up</button>
```

## Common Issues

1. **State machine errors** → Check XState visualizer
2. **GraphQL errors** → Check Network tab
3. **Form validation** → Review Yup schema

## Exercises

See `../exercises/frontend.md`
