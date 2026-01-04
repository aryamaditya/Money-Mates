// services/categoryService.js
const API_BASE = "https://localhost:7167/api/dashboard";

const categoryService = {
  // Fetch categories with usage (from dashboard API)
  getCategoryUsage: async (userId) => {
    const res = await fetch(`${API_BASE}/categories/${userId}`);
    if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
    return res.json();
  },

  // Fetch detailed expenses for a specific category
  getCategoryExpenses: async (userId, categoryName) => {
    const res = await fetch(`${API_BASE}/categoryExpenses/${userId}?category=${encodeURIComponent(categoryName)}`);
    if (!res.ok) throw new Error(`Failed to fetch category expenses: ${res.status}`);
    return res.json();
  },

  // Other category-related methods can go here if needed
};

export default categoryService;
