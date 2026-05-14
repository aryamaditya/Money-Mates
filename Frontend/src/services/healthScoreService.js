/**
 * healthScoreService.js
 * Fetches the calculated Financial Health Score and metrics from the backend.
 */

const API_BASE_URL = "http://localhost:5262/api";

const healthScoreService = {
  /**
   * Fetch all required data and calculate financial health
   * Returns comprehensive health report with all metrics
   */
  calculateFinancialHealth: async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/AIInsights/financial-health/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial health data');
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching financial health:", error);
      throw error;
    }
  },
};

export default healthScoreService;
