const { SquashAPI } = require('./squash-api');

let squashApi = null;
let currentIterationId = null;

module.exports = {
  squashInit: async (config) => {
    squashApi = new SquashAPI(config);
    await squashApi.login();
    return { success: true };
  },

  squashCreateIteration: async ({ campaignId, name }) => {
    console.log("squashCreateIteration called with:", { campaignId, name });
    const iteration = await squashApi.createIteration(campaignId, name);
    currentIterationId = iteration.id;
    return iteration;
  },

  squashReportResult: async ({ iterationId, testCaseId, status }) => {
    console.log('[SquashTask] Report called:', { iterationId, testCaseId, status });
    try {
      console.log('[SquashTask] Adding test case to iteration...');
      await squashApi.addTestCaseToIteration(iterationId, testCaseId);
      console.log('[SquashTask] Test case added');

      console.log('[SquashTask] Getting test plan...');
      const testPlan = await squashApi.getIterationTestPlan(iterationId);
      console.log('[SquashTask] Test plan items:', testPlan._embedded?.['test-plan']?.length);

      console.log('[SquashTask] Full test plan:', JSON.stringify(testPlan, null, 2));

      // Find the test plan item that matches our testCaseId
      const tpItem = testPlan._embedded?.['test-plan']?.find(
        item => item.referenced_test_case?.id === testCaseId
      );
      console.log('[SquashTask] Using test plan item:', tpItem?.id, 'for test case:', testCaseId);

      if (tpItem) {
        console.log('[SquashTask] Creating execution...');
        const execution = await squashApi.createExecution(tpItem.id);
        console.log('[SquashTask] Execution created:', execution?.id);

        if (execution) {
          console.log('[SquashTask] Updating status to:', status);
          await squashApi.updateExecutionStatus(execution.id, status);
          console.log('[SquashTask] Status updated successfully');
          return { success: true, executionId: execution.id };
        }
        console.log('[SquashTask] Execution creation returned null');
      }
      console.log('[SquashTask] Test plan item not found');
      return { success: false, reason: 'Test plan item not found' };
    } catch (error) {
      console.error('[SquashTask] ERROR:', error.message);
      console.error('[SquashTask] Stack:', error.stack);
      return { success: false, error: error.message };
    }
  },

  squashFinish: async () => {
    if (currentIterationId) {
      await squashApi.finishIteration(currentIterationId);
      return { success: true };
    }
    return { success: false };
  },

  squashCreateCampaign: async ({ folderId, name }) => {
    console.log("squashCreateCampaign called with:", { folderId, name });
    const campaign = await squashApi.createCampaign(folderId, name);
    return campaign;
  },
};
