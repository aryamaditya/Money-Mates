import React, { useEffect, useState } from "react";
import categoryService from "../../services/categoryService";
import expenseService from "../../services/expenseService";
import styles from "./Dashboard.module.css";
import "./CategorySection.css";

const CategorySection = ({ userId, totalBalance = 0 }) => {
  const [categories, setCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryLimit, setNewCategoryLimit] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editLimit, setEditLimit] = useState("");
  const [updatingCategory, setUpdatingCategory] = useState(false);
  const [addingExpenseCategory, setAddingExpenseCategory] = useState(null);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [addingExpense, setAddingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState(null);
  const [billImage, setBillImage] = useState(null);
  const [billImagePreview, setBillImagePreview] = useState(null);
  const [viewingBillImage, setViewingBillImage] = useState(null); // For modal viewer

  // Icon mapping for categories
  const CATEGORY_ICONS = {
    Food: "🍔",
    Transport: "🚗",
    Entertainment: "🎬",
  };

  const fetchCategories = async () => {
    if (!userId) {
      console.warn("No userId provided to CategorySection");
      setCategories([]);
      return;
    }

    try {
      console.log("Fetching categories for userId:", userId);

      // Try to fetch from CategoryController first
      try {
        const categoriesData = await categoryService.getCategoriesWithLimits(userId);
        console.log("CategoryController response:", categoriesData);
        console.log("Category details:", categoriesData?.map(c => ({ 
          Category: c.Category || c.category, 
          Used: c.Used || c.used, 
          Limit: c.Limit || c.limit 
        })));

        if (categoriesData && categoriesData.length > 0) {
          // Map CategoryController format - check both PascalCase and camelCase
          const mapped = categoriesData
            .filter(c => (c.Category || c.category) && (c.Category || c.category) !== "undefined")
            .map(c => ({
              name: c.Category || c.category,
              used: (c.Used || c.used) || 0,
              limit: (c.Limit || c.limit) || 0,
              key: c.Category || c.category,
              expenses: [],
            }));

          console.log("Mapped categories from CategoryController:", mapped);
          setCategories(mapped);
          return;
        }
      } catch (err) {
        console.warn("CategoryController failed:", err.message);
      }

      // Fallback to Dashboard categories endpoint
      console.log("Falling back to Dashboard API...");
      const dashboardData = await categoryService.getCategoryUsage(userId);
      console.log("Dashboard API response:", dashboardData);

      if (dashboardData && dashboardData.length > 0) {
        // Map dashboard format (name, value) to component format
        const mapped = dashboardData
          .filter(c => (c.name || c.Name) && (c.name || c.Name) !== "undefined")
          .map(c => ({
            name: c.name || c.Name,
            used: (c.value || c.Value) || 0,
            limit: (c.value || c.Value) || 0,
            key: c.name || c.Name,
            expenses: [],
          }));

        console.log("Mapped categories from Dashboard:", mapped);
        setCategories(mapped);
      } else {
        console.warn("No categories found from either API");
        setCategories([]);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [userId]);

  const toggleCategory = async (categoryName) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
      return;
    }

    const cat = categories.find(c => c.name === categoryName);
    if (cat && cat.expenses.length === 0) {
      try {
        const expenses = await categoryService.getCategoryExpenses(userId, categoryName);
        setCategories(prev =>
          prev.map(c =>
            c.name === categoryName ? { ...c, expenses } : c
          )
        );
      } catch (err) {
        console.error("Failed to fetch category expenses:", err);
      }
    }

    setExpandedCategory(categoryName);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    if (!newCategoryLimit || parseFloat(newCategoryLimit) <= 0) {
      alert("Please enter a valid budget limit");
      return;
    }

    // Calculate total of all existing category limits
    const totalCategoryLimits = categories.reduce((sum, cat) => sum + cat.limit, 0);
    const proposedNewLimit = parseFloat(newCategoryLimit);
    const totalIfAdded = totalCategoryLimits + proposedNewLimit;

    // Validate that total category limits don't exceed total balance
    if (totalIfAdded > totalBalance) {
      const available = Math.max(totalBalance - totalCategoryLimits, 0);
      alert(
        `Budget limit exceeds available balance!\n\n` +
        `Total Balance: Rs ${totalBalance.toLocaleString()}\n` +
        `Current Category Limits: Rs ${totalCategoryLimits.toLocaleString()}\n` +
        `Available to allocate: Rs ${available.toLocaleString()}\n\n` +
        `Please enter a limit of Rs ${available.toLocaleString()} or less.`
      );
      return;
    }

    setAddingCategory(true);
    try {
      await categoryService.addCategory(userId, newCategoryName.trim(), proposedNewLimit);
      console.log("Category added successfully");
      
      // Reset form
      setNewCategoryName("");
      setNewCategoryLimit("");
      setShowAddForm(false);
      
      // Refresh categories
      fetchCategories();
    } catch (err) {
      console.error("Failed to add category:", err);
      alert("Failed to add category. Please try again.");
    } finally {
      setAddingCategory(false);
    }
  };

  const handleEditCategory = (categoryName, currentLimit) => {
    setEditingCategory(categoryName);
    setEditLimit(currentLimit.toString());
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    
    if (!editLimit || parseFloat(editLimit) <= 0) {
      alert("Please enter a valid budget limit");
      return;
    }

    const currentCategory = categories.find(c => c.name === editingCategory);
    const newLimit = parseFloat(editLimit);

    // Only allow increasing the limit if overspent
    if (currentCategory.used > currentCategory.limit) {
      if (newLimit < currentCategory.used) {
        alert(`Budget limit must be at least Rs ${currentCategory.used.toLocaleString()} to cover your current spending.`);
        return;
      }
    }

    setUpdatingCategory(true);
    try {
      await categoryService.updateCategoryLimit(userId, editingCategory, newLimit);
      console.log("Category updated successfully");
      
      setEditingCategory(null);
      setEditLimit("");
      fetchCategories();
    } catch (err) {
      console.error("Failed to update category:", err);
      alert("Failed to update category. Please try again.");
    } finally {
      setUpdatingCategory(false);
    }
  };

  const handleAddExpense = async (e, categoryName) => {
    e.preventDefault();
    
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setAddingExpense(true);
    try {
      await expenseService.addExpense(userId, categoryName, parseFloat(expenseAmount), billImage);
      console.log("Expense added successfully with bill image");
      
      setExpenseAmount("");
      setExpenseDescription("");
      setBillImage(null);
      setBillImagePreview(null);
      setAddingExpenseCategory(null);
      
      // Refresh categories to update the 'used' amount
      await fetchCategories();
      
      // Also fetch and update expenses for this specific category
      try {
        const expenses = await categoryService.getCategoryExpenses(userId, categoryName);
        console.log("Updated expenses for category:", expenses);
        
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.name === categoryName
              ? { ...cat, expenses: expenses || [] }
              : cat
          )
        );
      } catch (err) {
        console.warn("Failed to fetch category expenses:", err);
      }
    } catch (err) {
      console.error("Failed to add expense:", err);
      alert("Failed to add expense. Please try again.");
    } finally {
      setAddingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId, categoryName) => {
    if (!window.confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
      return;
    }

    setDeletingExpenseId(expenseId);
    try {
      await expenseService.deleteExpense(expenseId);
      console.log("Expense deleted successfully");
      
      // Refresh categories to update the 'used' amount
      await fetchCategories();
      
      // Also fetch and update expenses for this specific category
      try {
        const expenses = await categoryService.getCategoryExpenses(userId, categoryName);
        console.log("Updated expenses for category after deletion:", expenses);
        
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.name === categoryName
              ? { ...cat, expenses: expenses || [] }
              : cat
          )
        );
      } catch (err) {
        console.warn("Failed to fetch category expenses:", err);
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      alert("Only JPG and PNG images are allowed");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result;
      setBillImage(base64String);
      setBillImagePreview(base64String);
      console.log("Image converted to base64, size:", base64String?.length || 0);
    };
    reader.readAsDataURL(file);
  };

  // Calculate status: "safe", "warning", or "exceeded"
  const getStatus = (used, limit) => {
    if (used > limit) return "exceeded";
    if (used > limit * 0.8) return "warning";
    return "safe";
  };

  const getProgressPercentage = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <div className="category-section">
      <div className="category-header">
        <div className="header-top">
          <div>
            <h3 className="category-title">📊 Budget Categories</h3>
            <p className="category-subtitle">Track your spending by category</p>
          </div>
          <button 
            className="btn-add-category"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "✕ Cancel" : "+ Add Category"}
          </button>
        </div>

        {showAddForm && (
          <form className="add-category-form" onSubmit={handleAddCategory}>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                placeholder="e.g., Shopping, Utilities, Rent"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Budget Limit (Rs)</label>
              <input
                type="number"
                placeholder="e.g., 5000"
                value={newCategoryLimit}
                onChange={(e) => setNewCategoryLimit(e.target.value)}
                required
                min="0"
                max={Math.max(totalBalance - categories.reduce((sum, cat) => sum + cat.limit, 0), 0)}
              />
              <small className="available-balance">
                Available: Rs {Math.max(totalBalance - categories.reduce((sum, cat) => sum + cat.limit, 0), 0).toLocaleString()} 
                / Total Balance: Rs {totalBalance.toLocaleString()}
              </small>
              {newCategoryLimit && parseFloat(newCategoryLimit) > Math.max(totalBalance - categories.reduce((sum, cat) => sum + cat.limit, 0), 0) && (
                <small className="limit-warning">
                  ⚠️ Exceeds available balance
                </small>
              )}
            </div>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={addingCategory || (newCategoryLimit && parseFloat(newCategoryLimit) > Math.max(totalBalance - categories.reduce((sum, cat) => sum + cat.limit, 0), 0))}
            >
              {addingCategory ? "Adding..." : "Add Category"}
            </button>
          </form>
        )}

      {categories.length === 0 ? (
        <div className="loading-state">Loading categories...</div>
      ) : (
        <div className="category-list">
          {categories.map(c => {
            const status = getStatus(c.used, c.limit);
            const percentage = getProgressPercentage(c.used, c.limit);
            const remaining = Math.max(c.limit - c.used, 0);

            return (
              <React.Fragment key={c.key}>
                <div
                  className={`category-card ${status}`}
                  onClick={() => toggleCategory(c.name)}
                >
                  <div className="category-card-header">
                    <div className="category-info">
                      <span className="category-icon">{CATEGORY_ICONS[c.name] || "💰"}</span>
                      <div className="category-text">
                        <h4 className="category-name">{c.name}</h4>
                        <p className="category-stat">
                          Rs {c.used.toLocaleString()} / Rs {c.limit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="category-badge">
                      <span className={`status-badge ${status}`}>
                        {status === "exceeded" ? "⚠️ Over" : `${Math.round(percentage)}%`}
                      </span>
                    </div>
                  </div>

                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${status}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="category-footer">
                    <div className="remaining-info">
                      <p className={`remaining ${status}`}>
                        {status === "exceeded"
                          ? `❌ Over by Rs ${(c.used - c.limit).toLocaleString()}`
                          : `✅ Rs ${remaining.toLocaleString()} remaining`}
                      </p>
                    </div>
                    <div className="footer-actions">
                      {status === "exceeded" && (
                        <button 
                          className="btn-edit-category btn-edit-overspent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCategory(c.name, c.limit);
                          }}
                          title="Increase budget limit"
                        >
                          ⬆️ Increase Limit
                        </button>
                      )}
                      <span className="expand-icon">
                        {expandedCategory === c.name ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </div>

                {editingCategory === c.name && (
                  <div className="edit-category-form">
                    <div className="edit-form-header">
                      <h5>Edit Budget Limit - {c.name}</h5>
                      <button
                        className="btn-close-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(null);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="edit-form-content">
                      {c.used > c.limit && (
                        <div className="overspend-info">
                          <p className="overspend-alert">
                            💰 You have overspent by Rs {(c.used - c.limit).toLocaleString()} in this category!
                          </p>
                          <p className="overspend-detail">
                            Spent: Rs {c.used.toLocaleString()} | Current Limit: Rs {c.limit.toLocaleString()}
                          </p>
                        </div>
                      )}
                      <div className="edit-info">
                        <div className="edit-info-item">
                          <label>Current Spent:</label>
                          <span className="value">Rs {c.used.toLocaleString()}</span>
                        </div>
                        <div className="edit-info-item">
                          <label>Current Limit:</label>
                          <span className="value">Rs {c.limit.toLocaleString()}</span>
                        </div>
                      </div>
                      <form onSubmit={handleUpdateCategory}>
                        <div className="form-group">
                          <label>New Budget Limit (Rs)</label>
                          <input
                            type="number"
                            value={editLimit}
                            onChange={(e) => setEditLimit(e.target.value)}
                            required
                            min={c.used}
                          />
                          <small className="info-text">
                            Minimum allowed: Rs {c.used.toLocaleString()} (your current spent amount)
                          </small>
                        </div>
                        <div className="edit-form-actions">
                          <button
                            type="submit"
                            className="btn-submit-edit"
                            disabled={updatingCategory}
                          >
                            {updatingCategory ? "Updating..." : "Increase Limit"}
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-edit"
                            onClick={() => setEditingCategory(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {expandedCategory === c.name && (
                  <div className="expense-details">
                    <div className="expense-header">
                      <h5>Recent Expenses</h5>
                    </div>
                    {c.expenses.length > 0 ? (
                      <>
                        <div className="expense-list">
                          {c.expenses.map((e, idx) => (
                            <div key={`${e.id}-${idx}`} className="expense-item">
                              <div className="expense-info">
                                <div className="expense-date">
                                  {new Date(e.dateAdded).toLocaleDateString()}
                                </div>
                                <div className="expense-amount">Rs {e.amount.toLocaleString()}</div>
                                {e.billImageBase64 && (
                                  <span 
                                    className="bill-icon" 
                                    title="Click to view bill photo"
                                    onClick={() => setViewingBillImage(e.billImageBase64)}
                                    style={{ cursor: 'pointer' }}
                                  >📷</span>
                                )}
                              </div>
                              <button
                                className="btn-delete-expense"
                                onClick={() => handleDeleteExpense(e.id, c.name)}
                                disabled={deletingExpenseId === e.id}
                                title="Delete this expense"
                              >
                                {deletingExpenseId === e.id ? "Deleting..." : "🗑️ Delete"}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="expense-total">
                          <strong>Total:</strong> Rs
                          {c.expenses
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}
                        </div>
                      </>
                    ) : (
                      <div className="no-expenses">
                        <p>📭 No expenses recorded yet</p>
                      </div>
                    )}
                    
                    <div className="add-expense-section">
                      {addingExpenseCategory === c.name ? (
                        <form className="add-expense-form" onSubmit={(e) => handleAddExpense(e, c.name)}>
                          <div className="form-group">
                            <label>Amount (Rs)</label>
                            <input
                              type="number"
                              placeholder="e.g., 500"
                              value={expenseAmount}
                              onChange={(e) => setExpenseAmount(e.target.value)}
                              required
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div className="form-group">
                            <label>Description (Optional)</label>
                            <input
                              type="text"
                              placeholder="e.g., Lunch at restaurant"
                              value={expenseDescription}
                              onChange={(e) => setExpenseDescription(e.target.value)}
                            />
                          </div>
                          <div className="form-group">
                            <label>Bill Photo (Optional)</label>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg"
                              onChange={handleImageUpload}
                              className="file-input"
                            />
                            <small className="file-info">Supported: JPG, PNG (Max 5MB)</small>
                          </div>
                          {billImagePreview && (
                            <div className="bill-preview">
                              <p className="preview-label">📸 Bill Preview:</p>
                              <img src={billImagePreview} alt="Bill preview" className="preview-image" />
                              <button
                                type="button"
                                onClick={() => {
                                  setBillImage(null);
                                  setBillImagePreview(null);
                                }}
                                className="btn-remove-image"
                              >
                                ✕ Remove Image
                              </button>
                            </div>
                          )}
                          <div className="form-actions">
                            <button
                              type="submit"
                              className="btn-submit-expense"
                              disabled={addingExpense}
                            >
                              {addingExpense ? "Adding..." : "Add Expense"}
                            </button>
                            <button
                              type="button"
                              className="btn-cancel-expense"
                              onClick={() => {
                                setAddingExpenseCategory(null);
                                setExpenseAmount("");
                                setExpenseDescription("");
                                setBillImage(null);
                                setBillImagePreview(null);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          className="btn-add-expense"
                          onClick={() => setAddingExpenseCategory(c.name)}
                        >
                          + Add Expense
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Bill Image Viewer Modal */}
      {viewingBillImage && (
        <div className="bill-image-modal-overlay" onClick={() => setViewingBillImage(null)}>
          <div className="bill-image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="bill-image-modal-close"
              onClick={() => setViewingBillImage(null)}
              title="Close (ESC)"
            >
              ✕
            </button>
            <img 
              src={viewingBillImage} 
              alt="Bill" 
              className="bill-image-modal-img"
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CategorySection;
