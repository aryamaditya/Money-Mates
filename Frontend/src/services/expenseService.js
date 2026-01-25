/**
 * expenseService.js
 * API service for managing user expenses
 * Handles expense CRUD operations (Create, Read, Delete)
 */

// Base URL for expense API endpoint
const API_BASE_EXPENSES = "http://localhost:5262/api/expenses";

const expenseService = {
  /**
   * getUserExpenses - Fetch ALL expenses for a specific user
   * @param {number} userId - The user ID to fetch expenses for
   * @returns {Promise<Array>} Array of all expense objects
   * Each expense: { id, userId, category, amount, dateAdded, billImageBase64 }
   */
  getUserExpenses: async (userId) => {
    const res = await fetch(`${API_BASE_EXPENSES}/${userId}`);
    if (!res.ok) throw new Error(`Failed to fetch expenses: ${res.status}`);
    return res.json();
  },

  /**
   * getRecentExpenses - Fetch most recent expenses for a user
   * @param {number} userId - The user ID
   * @returns {Promise<Array>} Array of recent expense objects (limited set)
   * Used in Dashboard to show recent transaction history
   */
  getRecentExpenses: async (userId) => {
    const res = await fetch(`${API_BASE_EXPENSES}/recent/${userId}`);
    if (!res.ok) throw new Error(`Failed to fetch recent expenses: ${res.status}`);
    return res.json();
  },

  /**
   * addExpense - Create a new expense entry
   * @param {number} userId - The user ID who owns this expense
   * @param {string} category - Budget category (e.g., "Food", "Transport")
   * @param {number} amount - Expense amount in rupees
   * @param {string} billImageBase64 - Optional Base64 encoded bill photo
   * @returns {Promise<Object>} Created expense object with ID and all properties
   * 
   * IMPORTANT: Sends PascalCase properties (UserId, Category, Amount, BillImageBase64)
   * to match ASP.NET Core backend conventions
   */
  addExpense: async (userId, category, amount, billImageBase64 = null) => {
    try {
      // Build payload with proper data types and PascalCase property names
      const payload = {
        UserId: parseInt(userId),           // Convert to integer
        Category: String(category),         // Ensure string
        Amount: parseFloat(amount),         // Convert to decimal number
        BillImageBase64: billImageBase64    // Include base64 image if provided (null if no photo)
      };
      
      console.log(`Adding expense to ${API_BASE_EXPENSES}:`, {
        UserId: payload.UserId,
        Category: payload.Category,
        Amount: payload.Amount,
        HasImage: !!payload.BillImageBase64  // Log whether image is included
      });
      
      // Send POST request to backend
      const res = await fetch(API_BASE_EXPENSES, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`Response status: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Failed to add expense: HTTP ${res.status}`, errorText);
        throw new Error(`Failed to add expense: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log("Expense added successfully:", data);
      return data;
    } catch (err) {
      console.error("addExpense error:", err);
      throw err;
    }
  },

  /**
   * deleteExpense - Remove an expense by ID
   * @param {number} expenseId - The ID of expense to delete
   * @returns {Promise<Object>} Deleted expense object or confirmation
   * HTTP Method: DELETE
   */
  deleteExpense: async (expenseId) => {
    const res = await fetch(`${API_BASE_EXPENSES}/${expenseId}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error(`Failed to delete expense: ${res.status}`);
    return res.json();
  },
};

export default expenseService;
