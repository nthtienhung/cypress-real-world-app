const https = require('https');

function sendToTeams(webhookUrl, message) {
  const data = JSON.stringify({
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": "Cypress Test Results",
    "themeColor": message.status === 'success' ? '0078D4' : 'FF0000',
    "title": message.title,
    "text": message.text,
    "sections": [{
      "facts": message.facts
    }]
  });

  const url = new URL(webhookUrl);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
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

// Get test results from command line
const status = process.argv[2]; // 'success' or 'failure'
const totalTests = process.argv[3];
const passedTests = process.argv[4];
const failedTests = process.argv[5];
const workflowUrl = process.argv[6];

const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

const message = {
  status,
  title: status === 'success' ? '✅ Tests Passed' : '❌ Tests Failed',
  text: `Cypress test run completed`,
  facts: [
    { name: 'Total Tests', value: totalTests },
    { name: 'Passed', value: passedTests },
    { name: 'Failed', value: failedTests },
    { name: 'Workflow', value: workflowUrl }
  ]
};

sendToTeams(webhookUrl, message)
  .then(() => console.log('Teams notification sent!'))
  .catch(err => console.error('Failed to send:', err));
