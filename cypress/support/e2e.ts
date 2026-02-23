// @ts-check
import "@cypress/code-coverage/support";
import "./commands";
import { isMobile } from "./utils";
import { getTestCaseId } from "./squash-mappings";

beforeEach(() => {
  cy.intercept(
    { url: "http://localhost:3001/**", middleware: true },
    (req) => delete req.headers["if-none-match"]
  );

  if (isMobile()) {
    cy.intercept({ url: "http://localhost:3001/**", middleware: true }, (req) => {
      req.on("response", (res) => {
        res.setThrottle(1000);
      });
    });
  }
});

const FOLDER_ID = 4;
let campaignId: number | null = null;
let iterationId: number | null = null;

before(() => {
  cy.readFile("apitoken.txt").then((apiToken: string) => {
    cy.task("squash:init", {
      baseUrl: "https://squash-tm-dev-01.l0tt0.online",
      username: "hung.nguyen",
      password: "bannerman123",
      apiToken: apiToken.trim(),
    });

    // Create campaign in folder 4
    cy.task("squash:createCampaign", {
      folderId: FOLDER_ID,
      name: `Auto-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    }).then((campaign: any) => {
      campaignId = campaign.id;
      cy.log(`Created campaign ID: ${campaignId}`);

      // Create iteration
      cy.task("squash:createIteration", {
        campaignId: campaign.id,
        name: `Run ${Date.now()}`,
      }).then((iteration: any) => {
        iterationId = iteration.id;
        cy.log(`Created iteration ID: ${iterationId}`);
      });
    });
  });
});

afterEach(function () {
  console.log("=== afterEach running ===");  // Add this
  cy.log("TEST AFTER HOOK RUNNING =====================")
  const testName = this.currentTest?.title || "";
  const testCaseId = getTestCaseId(testName);
  if (!testCaseId || !iterationId) return;

  const status = this.currentTest?.state === "passed" ? "SUCCESS" : "FAILURE";

  cy.log("Test name:", this.currentTest?.title);
  cy.log("Test state:", this.currentTest?.state);
  cy.log("Mapped ID:", testCaseId);
  cy.log("Iteration ID:", iterationId);
  cy.log("Status:", status);

  cy.task("squash:report", { iterationId, testCaseId, status }).then((result: any) => {
    console.log("[Cypress] Task result:", result);
  });
});

after(() => {
  if (iterationId) {
    cy.task("squash:finish");
  }
});
