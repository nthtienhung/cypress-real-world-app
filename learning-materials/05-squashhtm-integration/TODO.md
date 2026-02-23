# SquashTM Integration - TODO

## Automation

- [ ] Automate test case creation via SquashTM API
  - Create test cases from Cypress specs or JSON
  - Auto-generate squash-mappings.ts
  - API: `POST /squash/api/rest/latest/test-cases`

## Code Improvements

- [ ] Fix race condition in `after()` hook
  - Use `.then()` to ensure `squash:finish` completes

- [ ] Add error handling for SquashTM failures
  - Check task result, log warnings
  - Decide: should test fail if SquashTM is down?

- [ ] Remove hardcoded credentials from `e2e.ts`
  - Move to `.env` file
  - Use `Cypress.env()` to read

## Understanding Exercises

- [ ] Exercise 4: Prove CORS exists
- [ ] Exercise 5: Trace authentication flow
- [ ] Exercise 6: Map the data model
- [ ] Exercise 7: Test failure reporting

## Advanced

- [ ] Handle multiple spec files (one iteration vs many)
- [ ] Auto-map test names (match by name, not manual ID)
- [ ] Screenshot upload on failure
- [ ] Dry run mode (log what would happen, no API calls)
