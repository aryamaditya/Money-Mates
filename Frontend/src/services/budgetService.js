/**
 * budgetService.js
 * API service for managing user budgets
 * Handles budget operations and budget tracking
 */

const API_BASE_BUDGET = "http://localhost:5262/api/budget";

const budgetService = {
  /**
   * getUserBudgets - Fetch all budgets for a specific user
   * @param {number} userId - The user ID to fetch budgets for
   * @returns {Promise<Array>} Array of budget objects
   */
  getUserBudgets: async (userId) => {
    try {
      const res = await fetch(`${API_BASE_BUDGET}/${userId}`);
      if (!res.ok) throw new Error(`Failed to fetch budgets: ${res.status}`);
      return res.json();
    } catch (err) {
      console.error('Error fetching budgets:', err);
      return [];
    }
  },

  /**
   * addBudget - Create a new budget for a category
   * @param {number} userId - The user ID
   * @param {string} category - Budget category name
   * @param {number} limit - Budget limit amount
   * @returns {Promise<Object>} Created budget object
   */
  addBudget: async (userId, category, limit) => {
    try {
      const payload = {
        UserId: parseInt(userId),
        Category: category,
        Limit: parseFloat(limit)
      };

      const res = await fetch(API_BASE_BUDGET, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Failed to add budget: ${res.status}`);
      return res.json();
    } catch (err) {
      console.error('Error adding budget:', err);
      throw err;
    }
  },

  /**
   * updateBudget - Update an existing budget
   * @param {number} budgetId - The budget ID to update
   * @param {string} category - Budget category name
   * @param {number} limit - New budget limit amount
   * @returns {Promise<Object>} Updated budget object
   */
  updateBudget: async (budgetId, category, limit) => {
    try {
      const payload = {
        Category: category,
        Limit: parseFloat(limit)
      };

      const res = await fetch(`${API_BASE_BUDGET}/${budgetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Failed to update budget: ${res.status}`);
      return res.json();
    } catch (err) {
      console.error('Error updating budget:', err);
      throw err;
    }
  },

  /**
   * deleteBudget - Delete a budget
   * @param {number} budgetId - The budget ID to delete
   * @returns {Promise<void>}
   */
  deleteBudget: async (budgetId) => {
    try {
      const res = await fetch(`${API_BASE_BUDGET}/${budgetId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error(`Failed to delete budget: ${res.status}`);
    } catch (err) {
      console.error('Error deleting budget:', err);
      throw err;
    }
  }
};

export default budgetService;
