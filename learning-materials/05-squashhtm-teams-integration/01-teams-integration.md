# Microsoft Teams Integration

Send Cypress test results to Teams channel via webhook.

---

## Prerequisites

- Teams channel with webhook configured
- GitHub repository with Actions enabled

---

## Step 1: Create Teams Webhook

1. Open Teams channel → **...** → **Connectors**
2. Search **"Incoming Webhook"** → **Configure**
3. Name: `Cypress CI` → Copy **Webhook URL**

---

## Step 2: Create Notification Script

File: `scripts/notify-teams.js`

```javascript
const https = require('https');

function sendToTeams(webhookUrl, message) {
  const data = JSON.stringify({
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Cypress Test Results",
    "themeColor": message.status === 'success' ? '0078D4' : 'FF0000',
    "title": message.title,
    "text": message.text,
    "sections": [{ "facts": message.facts }]
  });

  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', resolve);
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Usage: node notify-teams.js <status> <total> <passed> <failed> <url>
const status = process.argv[2];
const totalTests = process.argv[3];
const passedTests = process.argv[4];
const failedTests = process.argv[5];
const workflowUrl = process.argv[6];
const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

sendToTeams(webhookUrl, {
  status,
  title: status === 'success' ? '✅ Tests Passed' : '❌ Tests Failed',
  text: 'Cypress test run completed',
  facts: [
    { name: 'Total Tests', value: totalTests },
    { name: 'Passed', value: passedTests },
    { name: 'Failed', value: failedTests },
    { name: 'Workflow', value: workflowUrl }
  ]
});
```

---

## Step 3: Add GitHub Secret

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. New repository secret:
   - Name: `TEAMS_WEBHOOK_URL`
   - Value: Your Teams webhook URL

---

## Step 4: Update Workflow

Add to `.github/workflows/ci-practice.yml`:

```yaml
- name: Notify Teams - Success
  if: success()
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  run: |
    node scripts/notify-teams.js "success" "13" "13" "0" "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"

- name: Notify Teams - Failure
  if: failure()
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  run: |
    node scripts/notify-teams.js "failure" "13" "10" "3" "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

---

## How It Works

| Event | Action |
|-------|--------|
| Tests pass | Green card in Teams channel |
| Tests fail | Red card in Teams channel |
| Card shows | Total, passed, failed, workflow link |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No message | Verify `TEAMS_WEBHOOK_URL` secret |
| Wrong format | Check JSON payload structure |
| 400 error | Webhook URL expired, regenerate in Teams |
