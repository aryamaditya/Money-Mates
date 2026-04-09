/**
 * dailyPlannerService.js
 * API service for Daily Planner
 * Handles all API calls for daily budget management
 */

const BASE_URL = 'http://localhost:5262/api/dailybudget';

export const dailyPlannerService = {
  /**
   * Get today's budget allocations
   */
  getTodaysBudgets: async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/today`);
      if (!response.ok) throw new Error('Failed to fetch today\'s budgets');
      return await response.json();
    } catch (error) {
      console.error('Error fetching today\'s budgets:', error);
      throw error;
    }
  },

  /**
   * Get today's summary (total allocated, spent, remaining)
   */
  getTodaysSummary: async (userId) => {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/summary/today`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching today\'s summary:', error);
      throw error;
    }
  },

  /**
   * Create or update a daily budget
   * @param {Object} budgetData - { userId, category, totalDailyBudget, allocatedAmount, actualSpending, status, notes }
   */
  createOrUpdateBudget: async (budgetData) => {
    try {
      const response = await fetch(`${BASE_URL}/create-or-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
      });
      if (!response.ok) throw new Error('Failed to save budget');
      return await response.json();
    } catch (error) {
      console.error('Error saving budget:', error);
      throw error;
    }
  },

  /**
   * Update budget status (Over/Under/On-Track)
   */
  updateBudgetStatus: async (budgetId, status) => {
    try {
      const response = await fetch(`${BASE_URL}/${budgetId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update status');
      return await response.json();
    } catch (error) {
      console.error('Error updating budget status:', error);
      throw error;
    }
  },

  /**
   * Delete a budget
   */
  deleteBudget: async (budgetId) => {
    try {
      const response = await fetch(`${BASE_URL}/${budgetId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete budget');
      return await response.json();
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  },

  /**
   * Get budget history for past N days
   */
  getBudgetHistory: async (userId, days = 30) => {
    try {
      const response = await fetch(`${BASE_URL}/user/${userId}/history/${days}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return await response.json();
    } catch (error) {
      console.error('Error fetching budget history:', error);
      throw error;
    }
  }
};
