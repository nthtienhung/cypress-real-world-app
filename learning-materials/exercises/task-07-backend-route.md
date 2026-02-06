# Task 7: Backend Route

**Goal:** Add a new API endpoint to get user stats.

## What to Do

1. Open `backend/user-routes.ts`
2. Add GET `/users/:userId/stats` endpoint
3. Return:
   - Total transactions
   - Total sent
   - Total received
4. Test it works

## Hints

- Use existing routes as template
- Query database with `db.get("transactions").filter()`
- Calculate totals from transaction amounts

## Test Your Endpoint

```bash
# Start backend
yarn start:api

# Test with curl or Postman
curl http://localhost:3001/users/USER_ID/stats
```

## Check Your Work

Endpoint works when:

- Returns JSON with stats
- 404 if user not found
- 200 with correct calculations

---

**Move to Task 8 when done.**
