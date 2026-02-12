/**
 * SquashTM API Client
 * Based on Postman collection: squashtm.postman_collection.json
 * Base URL: http://localhost:8080
 */

const axios = require('axios');

class SquashAPI {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:8080';
    this.username = config.username || 'admin';
    this.password = config.password || 'admin';
    this.apiToken = config.apiToken || null;
    this.sessionCookie = null;
    this.xsrfToken = null;
  }

  /**
   * Step 1: Login to get session
   * POST /squash/backend/login
   */
  async login() {
    try {
      // First, get XSRF token from login page
      const preLogin = await axios.get(`${this.baseUrl}/squash/login`, {
        withCredentials: true
      });

      // Extract XSRF token from response headers or cookies
      const cookies = preLogin.headers['set-cookie'];
      if (cookies) {
        const xsrfMatch = cookies.find(c => c.includes('XSRF-TOKEN'));
        if (xsrfMatch) {
          this.xsrfToken = xsrfMatch.split(';')[0].split('=')[1];
        }
      }

      // Perform login
      const loginResponse = await axios.post(
        `${this.baseUrl}/squash/backend/login`,
        new URLSearchParams({
          username: this.username,
          password: this.password
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-XSRF-TOKEN': this.xsrfToken,
            'Cookie': `XSRF-TOKEN=${this.xsrfToken}`
          },
          withCredentials: true,
          maxRedirects: 0,
          validateStatus: (status) => status >= 200 && status < 400
        }
      );

      // Extract session cookie
      const sessionCookies = loginResponse.headers['set-cookie'];
      if (sessionCookies) {
        const jsessionMatch = sessionCookies.find(c => c.includes('JSESSIONID'));
        if (jsessionMatch) {
          this.sessionCookie = jsessionMatch.split(';')[0];
        }
      }

      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }
  }

  /**
   * Get headers with authentication
   * API uses Bearer token (API Token) for REST endpoints
   */
  getAuthHeaders() {
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // Use API Token if available, otherwise use session
    if (this.apiToken) {
      headers['Authorization'] = `Bearer ${this.apiToken}`;
    }

    // Still include cookies for XSRF protection if we have them
    if (this.sessionCookie && this.xsrfToken) {
      headers['Cookie'] = `${this.sessionCookie}; XSRF-TOKEN=${this.xsrfToken}`;
      headers['X-XSRF-TOKEN'] = this.xsrfToken;
    }

    return headers;
  }

  /**
   * Test connection - simple GET to verify session works
   */
  async testConnection() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/squash/api/rest/latest/campaigns`,
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );
      console.log('✅ Connection test successful');
      return response.data;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      }
      throw error;
    }
  }

  /**
   * Get campaign folders to find valid folder ID
   * GET /squash/api/rest/latest/campaign-folders
   */
  async getCampaignFolders() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/squash/api/rest/latest/campaign-folders`,
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Get folders failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 3: Create Iteration
   * POST /squash/api/rest/latest/campaigns/{campaignId}/iterations
   */
  async createIteration(campaignId, name = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const iterationName = name || `[Auto]-${timestamp}`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/squash/api/rest/latest/campaigns/${campaignId}/iterations`,
        {
          _type: 'iteration',
          name: iterationName,
          status: 'IN_PROGRESS',
          actual_start_auto: false,
          actual_end_auto: false
        },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );

      console.log(`✅ Iteration created: ${iterationName}`);
      return {
        id: response.data.id,
        name: iterationName,
        url: response.data._links?.self?.href
      };
    } catch (error) {
      console.error('❌ Create iteration failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Fetch test cases from project
   * GET /squash/api/rest/latest/test-cases
   */
  async getTestCases(projectId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/squash/api/rest/latest/test-cases?projectId=${projectId}`,
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Get test cases failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 4: Add test case to iteration
   * POST /squash/api/rest/latest/iterations/{iterationId}/test-plan
   */
  async addTestCaseToIteration(iterationId, testCaseId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}/test-plan`,
        {
          _type: 'campaign-test-plan-item',
          test_case: {
            _type: 'test-case',
            id: testCaseId
          }
        },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );

      console.log(`✅ Test case ${testCaseId} added to iteration ${iterationId}`);
      return {
        id: response.data.id,
        url: response.data._links?.self?.href
      };
    } catch (error) {
      console.error('❌ Add test case failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get iteration test plan items
   * GET /squash/api/rest/latest/iterations/{iterationId}/test-plan
   */
  async getIterationTestPlan(iterationId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}/test-plan`,
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );
      return response.data;
    } catch (error) {
      console.error('❌ Get iteration test plan failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 5: Create execution for test plan item
   * POST /squash/api/rest/latest/test-plan-items/{itemId}/executions
   */
  async createExecution(testPlanItemId) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/squash/api/rest/latest/test-plan-items/${testPlanItemId}/executions`,
        {
          _type: 'execution',
          execution_mode: 'AUTOMATED'
        },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );

      console.log(`✅ Execution created for test plan item ${testPlanItemId}`);
      return {
        id: response.data.id,
        url: response.data._links?.self?.href
      };
    } catch (error) {
      // Handle specific error: test case has no steps
      if (error.response && error.response.data && error.response.data.message === 'Execution has no steps') {
        console.log(`⚠️ Cannot create execution: Test case has no steps defined in SquashTM.`);
        console.log(`   To fix: Open SquashTM → Test Case → add steps → re-run.`);
        return null; // Return null instead of throwing
      }

      console.error('❌ Create execution failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Step 6: Update execution status
   * PATCH /squash/api/rest/latest/executions/{executionId}
   */
  async updateExecutionStatus(executionId, status) {
    const validStatuses = ['SUCCESS', 'FAILURE', 'BLOCKED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
      const response = await axios.patch(
        `${this.baseUrl}/squash/api/rest/latest/executions/${executionId}`,
        {
          _type: 'execution',
          execution_status: status
        },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );

      console.log(`✅ Execution ${executionId} status updated to: ${status}`);
      return {
        id: response.data.id,
        status: status
      };
    } catch (error) {
      console.error('❌ Update execution status failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Finish iteration
   * PATCH /squash/api/rest/latest/iterations/{iterationId}
   */
  async finishIteration(iterationId) {
    try {
      const response = await axios.patch(
        `${this.baseUrl}/squash/api/rest/latest/iterations/${iterationId}`,
        {
          status: 'FINISHED'
        },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );

      console.log(`✅ Iteration ${iterationId} marked as FINISHED`);
      return response.data;
    } catch (error) {
      console.error('❌ Finish iteration failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 2: Create Campaign
   * POST /squash/api/rest/latest/campaigns
   */
  async createCampaign(folderId, name = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const campaignName = name || `[Auto]-${timestamp}`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/squash/api/rest/latest/campaigns`,
        {
          _type: 'campaign',
          name: campaignName,
          status: 'IN_PROGRESS',
          actual_start_auto: false,
          actual_end_auto: false,
          parent: {
            _type: 'campaign-folder',
            id: folderId
          }
        },
        {
          headers: this.getAuthHeaders(),
          withCredentials: true
        }
      );

      console.log(`✅ Campaign created: ${campaignName}`);
      return {
        id: response.data.id,
        name: campaignName,
        url: response.data._links?.self?.href
      };
    } catch (error) {
      console.error('❌ Create campaign failed:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      throw error;
    }
  }
}

module.exports = { SquashAPI };
