# SquashTM Integration

Link Cypress tests to SquashTM test cases for centralized test management.

---

## What is SquashTM

Test management tool that tracks:
- Test cases (what to test)
- Test executions (when tests ran, pass/fail)
- Test history and trends

---

## Architecture

```
SquashTM Web UI          Squash Orchestrator           Cypress
     │                           │                        │
     │── Create test case ───────│                        │
     │                           │── Run tests ──────────▶│
     │                           │◀── JUnit results ──────│
     │◀── Results saved ─────────│                        │
```

---

## Step 1: JUnit Reporter Setup

Already configured in `cypress.config.ts`:

```typescript
export default defineConfig({
  reporter: "junit",
  reporterOptions: {
    mochaFile: "cypress/results/results-[hash].xml",
    toConsole: true,
  },
  // ... rest of config
});
```

Install reporter:
```bash
yarn add --dev cypress-junit-reporter
```

---

## Step 2: Link Test Case in SquashTM

### In SquashTM Web UI:

1. Create test case → Note ID (e.g., `TC-123`)
2. Open test case → **Automation** block
3. Fill **"Automated test reference"**:
   ```
   Format: [repository]#[test_file]

   Example:
   cypress-real-world-app#cypress/tests/api/api-users.spec.ts
   ```

### Components:
- `[repository]` = Git repository name
- `[project]` = Path to Cypress project (optional)
- `[test_file]` = Path to `.spec.ts` from project root

---

## Step 3: Access Parameters in Cypress

SquashTM passes parameters via environment variables:

```javascript
// In your test file
const tcRef = Cypress.env('TC_REFERENCE');  // TC-123
const tcUuid = Cypress.env('TC_UUID');
const datasetName = Cypress.env('DSNAME');
```

**Available parameters:**
- `TC_REFERENCE` - Test case reference
- `TC_UUID` - Test case UUID
- `DSNAME` - Dataset name
- `DS_[name]` - Dataset parameters

---

## Step 4: Run Tests

### Option A: With Orchestrator (Auto Results)

**Prerequisite**: Squash Orchestrator installed

1. In SquashTM: Click **Execute** on test case
2. Orchestrator runs: `yarn cypress run --spec "api-users.spec.ts"`
3. Results auto-posted to SquashTM

**Result mapping:**
- All pass → ✅ Success
- Any fail → ❌ Failed
- Any error → 🚫 Blocked

### Option B: Without Orchestrator (Manual Entry)

1. Run tests locally:
   ```bash
   yarn cypress run --spec "cypress/tests/api/api-users.spec.ts"
   ```

2. Check JUnit XML generated in `cypress/results/`

3. In SquashTM: Test case → **Executions** → **Add Execution**
   - Status: Success/Failed/Blocked
   - Comment: Manual result entry
   - Date: Today's date

---

## Step 5: Install Squash Orchestrator (Optional)

For auto results, install orchestrator:

```bash
# 1. Pull Docker image
docker pull squashtest/squash-orchestrator:latest

# 2. Generate auth keys
mkdir squash-keys && cd squash-keys
openssl genrsa -out trusted_key.pem 4096
openssl rsa -pubout -in trusted_key.pem -out trusted_key.pub

# 3. Run orchestrator
docker run -d \
  --name squash-orchestrator \
  -p 7774:7774 \
  -p 7775:7775 \
  -p 7776:7776 \
  -v /path/to/squash-keys:/etc/squashtf \
  -e SQUASH_LICENCE_TYPE=community \
  squashtest/squash-orchestrator:latest

# 4. Verify
curl http://localhost:7774/orchestrator/

# 5. Link to SquashTM
# Admin → Automated Testing → Orchestrator → Add: http://localhost:7774
```

---

## Summary

| Feature | With Orchestrator | Without |
|---------|-------------------|---------|
| Auto-run tests | ✅ Yes | ❌ No |
| Auto-import results | ✅ Yes | ❌ Manual entry |
| View test cases | ✅ Yes | ✅ Yes |
| See execution history | ✅ Yes | ✅ Yes (manual) |

---

## Official Documentation

- [SquashTM Cypress Guide](https://tm-en.doc.squashtest.com/latest/user-guide/manage-automated-tests/techno/cypress.html)
- [Orchestrator Install](https://autom-devops-en.doc.squashtest.com/2024-07/install/install.html)
