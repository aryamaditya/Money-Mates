/**
 * incomeService.js
 * API service for managing user income entries
 * Handles income CRUD operations (Create, Read, Delete)
 */

// Base URL for income API endpoint
const API_BASE_INCOME = "http://localhost:5262/api/income";

const incomeService = {
  /**
   * getUserIncome - Fetch ALL income entries for a specific user
   * @param {number} userId - The user ID to fetch income for
   * @returns {Promise<Array>} Array of all income objects
   * Each income: { id, userId, amount, source, dateAdded }
   */
  getUserIncome: async (userId) => {
    const res = await fetch(`${API_BASE_INCOME}/${userId}`);
    if (!res.ok) throw new Error(`Failed to fetch income: ${res.status}`);
    return res.json();
  },

  /**
   * getTotalIncome - Get sum of all income for a user
   * @param {number} userId - The user ID
   * @returns {Promise<number>} Total income amount as a number
   * Used in Dashboard to display total income statistic
   */
  getTotalIncome: async (userId) => {
    const res = await fetch(`${API_BASE_INCOME}/total/${userId}`);
    if (!res.ok) throw new Error(`Failed to fetch total income: ${res.status}`);
    return res.json();
  },

  /**
   * addIncome - Create a new income entry
   * @param {number} userId - The user ID who owns this income
   * @param {number} amount - Income amount in rupees
   * @param {string} source - Income source (e.g., "Salary", "Freelance", "Investment")
   * @returns {Promise<Object>} Created income object with ID and all properties
   * Automatically sets current date as entry date
   */
  addIncome: async (userId, amount, source) => {
    const res = await fetch(API_BASE_INCOME, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        amount,
        source,
        dateAdded: new Date().toISOString()  // Set current datetime
      })
    });
    if (!res.ok) throw new Error(`Failed to add income: ${res.status}`);
    return res.json();
  },

  /**
   * deleteIncome - Remove an income entry by ID
   * @param {number} incomeId - The ID of income to delete
   * @returns {Promise<Object>} Deleted income object or confirmation
   * HTTP Method: DELETE
   */
  deleteIncome: async (incomeId) => {
    const res = await fetch(`${API_BASE_INCOME}/${incomeId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error(`Failed to delete income: ${res.status}`);
    return res.json();
  },
};

export default incomeService;
