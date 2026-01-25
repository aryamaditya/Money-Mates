/**
 * categoryService.js
 * API service for managing budget categories and their usage
 * Handles all category-related HTTP requests to the backend
 */

// Base URLs for API endpoints
const API_BASE_DASHBOARD = "http://localhost:5262/api/dashboard";
const API_BASE_CATEGORY = "http://localhost:5262/api/category";

const categoryService = {
  /**
   * getCategoryUsage - Fetch spending breakdown by category from Dashboard API
   * @param {number} userId - The user ID to fetch categories for
   * @returns {Promise<Array>} Array of categories with their spending data
   * Used as FALLBACK when CategoryController is unavailable
   */
  getCategoryUsage: async (userId) => {
    try {
      console.log(`Fetching from ${API_BASE_DASHBOARD}/categories/${userId}`);
      const res = await fetch(`${API_BASE_DASHBOARD}/categories/${userId}`);
      if (!res.ok) {
        console.error(`Failed to fetch categories: HTTP ${res.status}`);
        throw new Error(`Failed to fetch categories: ${res.status}`);
      }
      const data = await res.json();
      console.log("getCategoryUsage result:", data);
      return data;
    } catch (err) {
      console.error("getCategoryUsage error:", err);
      throw err;
    }
  },

  /**
   * getCategoryExpenses - Fetch all expenses for a specific category
   * @param {number} userId - The user ID
   * @param {string} categoryName - The category name (e.g., "Food", "Transport")
   * @returns {Promise<Array>} Array of expense objects for that category
   * Each expense contains: id, userId, category, amount, dateAdded, billImageBase64
   */
  getCategoryExpenses: async (userId, categoryName) => {
    try {
      const url = `${API_BASE_CATEGORY}/${userId}/${encodeURIComponent(categoryName)}/expenses`;
      console.log(`Fetching from ${url}`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch category expenses: ${res.status}`);
      return res.json();
    } catch (err) {
      console.error("getCategoryExpenses error:", err);
      throw err;
    }
  },

  /**
   * getCategoriesWithLimits - Fetch all budget categories with limits and usage for a user
   * @param {number} userId - The user ID
   * @returns {Promise<Array>} Array of categories with: Category, Limit, Used properties
   * PRIMARY method - tries this first, falls back to getCategoryUsage if fails
   */
  getCategoriesWithLimits: async (userId) => {
    try {
      const url = `${API_BASE_CATEGORY}/${userId}`;
      console.log(`Fetching from ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`CategoryController returned HTTP ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      console.log("getCategoriesWithLimits result:", data);
      return data;
    } catch (err) {
      console.error("getCategoriesWithLimits error:", err);
      throw err;
    }
  },

  /**
   * updateCategoryLimit - Update the budget limit for an existing category
   * @param {number} userId - The user ID
   * @param {string} categoryName - The category name to update
   * @param {number} newLimit - The new budget limit amount
   * @returns {Promise<Object>} Updated budget object
   * HTTP Method: PUT
   */
  updateCategoryLimit: async (userId, categoryName, newLimit) => {
    const res = await fetch(`${API_BASE_CATEGORY}/${userId}/${encodeURIComponent(categoryName)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newLimit })
    });
    if (!res.ok) throw new Error(`Failed to update category limit: ${res.status}`);
    return res.json();
  },

  /**
   * addCategory - Create a new budget category with initial limit
   * @param {number} userId - The user ID
   * @param {string} categoryName - The name of new category (e.g., "Food", "Transport")
   * @param {number} limit - The initial budget limit for this category
   * @returns {Promise<Object>} Created budget object with ID and properties
   * Implementation: Uses PUT method (creates or updates)
   */
  addCategory: async (userId, categoryName, limit) => {
    try {
      const url = `${API_BASE_CATEGORY}/${userId}/${encodeURIComponent(categoryName)}`;
      console.log(`Adding category to ${url}`);
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newLimit: limit })
      });
      if (!res.ok) throw new Error(`Failed to add category: ${res.status}`);
      const data = await res.json();
      console.log("addCategory result:", data);
      return data;
    } catch (err) {
      console.error("addCategory error:", err);
      throw err;
    }
  },
};

export default categoryService;


