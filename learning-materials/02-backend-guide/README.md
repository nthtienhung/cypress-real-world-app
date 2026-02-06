# Backend Learning Guide

## Quick Start

```bash
yarn start:api          # Start backend only
yarn start:api:watch    # With auto-reload
```

## Architecture

```
backend/
├── app.ts              # Express app setup
├── auth.ts             # Passport authentication
├── user-routes.ts      # User API endpoints
├── contact-routes.ts   # Contact management
├── bankaccount-routes.ts
├── gql-playground-routes.ts
└── helpers.ts          # Auth helpers
```

## Key Concepts (The Tricky Parts)

### 1. CORS Configuration

Located in `backend/app.ts`:

```typescript
const corsOption = {
  origin: `http://localhost:${frontendPort}`,
  credentials: true,
};
```

**Important:** If exposing via ngrok, add your ngrok URL to the origin array.

### 2. Database (lowdb)

JSON-based database:

- `data/database.json` - Runtime data
- `data/database-seed.json` - Seed/template data

Query patterns in routes:

```typescript
const users = db.get("users").value();
const user = db.get("users").find({ id }).value();
```

### 3. Authentication Flow

1. Passport local strategy in `auth.ts`
2. Passwords hashed with bcrypt
3. Session stored via `express-session`
4. Check `req.isAuthenticated()` in routes

### 4. GraphQL Setup

- Schema loaded from `backend/graphql/` folder
- Resolvers inline in routes
- GraphQL Playground at `/graphql`

## API Endpoints

| Method | Endpoint      | Description        |
| ------ | ------------- | ------------------ |
| POST   | /login        | Authenticate       |
| POST   | /users        | Create user        |
| GET    | /users        | List users         |
| POST   | /transactions | Create transaction |
| GET    | /transactions | List transactions  |

## Common Issues

1. **CORS errors** → Update origin in `app.ts`
2. **Session not persisting** → Check cookie settings
3. **Database not found** → Ensure `data/database.json` exists

## Exercises

See `../exercises/backend.md`
