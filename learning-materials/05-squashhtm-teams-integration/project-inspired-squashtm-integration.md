# Integration Guide: Automated Testing Framework with Squash TM

## 1. Overview
This guide details the workflow and technical implementation for integrating a Java-based automated testing framework (using TestNG) with **Squash TM**. The objective is to automatically map test executions from code to Squash TM, creating campaigns and iterations, and updating test statuses (Pass/Fail) in real-time.

## 2. Core Concepts & Mapping Logic
To successfully report results, the automation framework mimics the manual workflow used in the Squash TM UI via API calls.

### Hierarchy Mapping
* **Project Folder:** A static folder in Squash TM (manually created) where reports will be stored.
* **Campaign:** A container for a specific test run or date.
* **Iteration:** A specific execution cycle within a campaign.
* **Test Case:** The individual test unit.
* **Execution:** The actual run of a test case within an iteration.

### The Automated Workflow
1.  **Initialization:** The script identifies the target **Project Folder** via ID.
2.  **Campaign Creation:** A new **Campaign** is created via API at the start of the suite.
3.  **Iteration Creation:** An **Iteration** is created and linked to the Campaign.
4.  **Test Mapping:** As each test runs, the code identifies the corresponding Squash TM **Test Case ID**.
5.  **Result Reporting:** The code adds the Test Case to the current Iteration and updates its status (Pass/Fail).
6.  **Finalization:** The Campaign and Iteration are marked as **"Finished"** to complete the report.

---

## 3. Configuration Setup

### Properties File (`dev.properties` or similar)
You must define specific configurations for the Squash TM integration:

* **`SQUASH_URL`**: The base URL of the Squash TM instance.
* **`SQUASH_USERNAME` / `SQUASH_PASSWORD`**: Credentials for API authentication.
* **`PROJECT_ID` / `FOLDER_ID`**: The specific ID of the folder where automated campaigns should be created.
* **`RUN_SQUASH` (Boolean)**:
    * `true`: Enables API calls to Squash TM (use for CI/CD or official runs).
    * `false`: Disables API calls (use for local debugging to avoid creating dummy data on the server).

---

## 4. Implementation Details (Java/TestNG)

The integration logic is typically handled in a base test class or a listener (e.g., `APIRunner.java`) using TestNG annotations.

### A. `@BeforeSuite` (Start of Run)
* **Action:** Check if `RUN_SQUASH` is true.
* **API Call:** Create a new **Campaign** inside the target Folder.
* **Logic:**
    * Generate a unique name for the campaign (e.g., timestamp + project name).
    * Store the returned `Campaign ID`.

### B. `@BeforeTest` (Before Tests Begin)
* **Action:** Create an execution container.
* **API Call:** Create a new **Iteration** linked to the `Campaign ID` generated in the previous step.
* **Logic:**
    * Store the returned `Iteration ID`.

### C. `@AfterMethod` (After Each Test Case)
* **Action:** Process the result of the individual test method.
* **Logic:**
    1.  Retrieve the **Test Case ID** associated with the test method (usually mapped via a custom annotation or method name).
    2.  **API Call 1 (Add):** Add this Test Case to the current `Iteration ID`.
    3.  **API Call 2 (Update):** specific execution status based on the TestNG result (`ITestResult`):
        * `SUCCESS` -> **PASS**
        * `FAILURE` -> **FAIL**
        * `SKIP` -> **SKIPPED**

### D. `@AfterSuite` (End of Run)
* **Action:** Finalize the report.
* **API Call:** Update the status of the **Iteration** and **Campaign** to **"Finished"** or **"Closed"**.
* **Reason:** This ensures the statistics in Squash TM are calculated correctly and the run is considered complete.

---

## 5. API Reference Notes
To implement the API calls, use the official Squash TM API documentation (often provided as a Swagger or Postman collection).

**Key Endpoints to Inspect:**
* `POST /campaigns`: Create a new campaign.
* `POST /iterations`: Create a new iteration.
* `POST /iterations/{id}/test-cases`: Add a test case to an iteration.
* `PATCH /executions/{id}`: Update the status of a specific execution.

## 6. Best Practices
1.  **Control Flags:** Always implement a global flag (e.g., `RUN_SQUASH`) to easily toggle reporting on/off.
2.  **Manual Verification:** Before automating, perform the workflow manually in the UI (Create Campaign -> Iteration -> Add Test) to understand the required data structure.
3.  **Error Handling:** Ensure API failures (e.g., server down) do not crash the actual test execution. Wrap API calls in `try-catch` blocks.