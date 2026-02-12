/**
 * Test script for SquashAPI client
 * Run: node scripts/test-squash-api.js
 */

const { SquashAPI } = require('../cypress/support/squash-api');
const fs = require('fs');

async function test() {
  // Read API token from file
  const apiToken = fs.readFileSync('./apitoken.txt', 'utf8').trim();

  const api = new SquashAPI({
    baseUrl: 'http://localhost:8080',
    username: 'admin',
    password: 'admin',
    apiToken: apiToken  // Use API token for REST API
  });

  try {
    console.log('Testing SquashTM API connection...\n');

    // Step 1: Login
    console.log('1. Logging in...');
    await api.login();

    // Step 2: Test connection (simple GET)
    console.log('\n2. Testing connection...');
    const campaigns = await api.testConnection();
    console.log('Campaigns:', campaigns);

    // Step 3: Get folders first
    console.log('\n3. Getting campaign folders...');
    const folders = await api.getCampaignFolders();
    console.log('Folders:', folders);

    // Step 4: Create or use existing campaign
    console.log('\n4. Checking existing campaigns...');
    const existingCampaigns = campaigns._embedded?.campaigns;
    let campaignId;
    let campaign;

    if (existingCampaigns && existingCampaigns.length > 0) {
      campaignId = existingCampaigns[0].id;
      campaign = existingCampaigns[0];
      console.log('Using existing campaign ID:', campaignId);
    } else {
      console.log('No campaigns found. You need to create a campaign folder in SquashTM UI first.');
      console.log('Go to: Projects > Your Project > Campaigns > Create Folder');
      process.exit(1);
    }

    // For now, let's just verify we have a campaign to work with
    console.log('Campaign:', campaign);

    // Step 5: Create Iteration
    console.log('\n5. Creating iteration...');
    const iteration = await api.createIteration(campaignId);
    console.log('Created iteration:', iteration);

    // Step 6: Get Test Cases
    console.log('\n6. Fetching test cases...');
    const projectId = 1; // Change to your project ID
    const testCases = await api.getTestCases(projectId);
    console.log('Test cases found:', testCases.page.totalElements);

    let testCaseId = null;
    let testPlanItemId = null;

    if (testCases._embedded && testCases._embedded['test-cases'] && testCases._embedded['test-cases'].length > 0) {
      testCaseId = testCases._embedded['test-cases'][0].id;
      console.log('Using test case ID:', testCaseId);

      // Step 7: Add test case to iteration
      console.log('\n7. Adding test case to iteration...');
      const testPlanItem = await api.addTestCaseToIteration(iteration.id, testCaseId);
      console.log('Test plan item created:', testPlanItem);

      // Step 7b: Get iteration test plan to find the actual test plan item ID
      console.log('\n7b. Getting iteration test plan...');
      const testPlan = await api.getIterationTestPlan(iteration.id);
      console.log('Test plan items:', testPlan.page.totalElements);

      if (testPlan._embedded && testPlan._embedded['test-plan'] && testPlan._embedded['test-plan'].length > 0) {
        // Get the first test plan item
        const tpItem = testPlan._embedded['test-plan'][0];
        testPlanItemId = tpItem.id;
        console.log('Using test plan item ID:', testPlanItemId);

        // Step 8: Create execution
        console.log('\n8. Creating execution...');
        const execution = await api.createExecution(testPlanItemId);

        if (execution) {
          // Step 9: Update execution status to SUCCESS
          console.log('\n9. Updating execution status...');
          await api.updateExecutionStatus(execution.id, 'SUCCESS');
        }

        // Step 10: Finish iteration
        console.log('\n10. Finishing iteration...');
        await api.finishIteration(iteration.id);
      } else {
        console.log('⚠️ No test plan items found in iteration.');
      }
    } else {
      console.log('⚠️ No test cases found in project. Skipping test execution steps.');
      console.log('Create a test case in SquashTM first.');
    }

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

test();
