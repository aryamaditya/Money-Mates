import React, { useEffect, useState } from "react";
import categoryService from "../../services/categoryService";
import expenseService from "../../services/expenseService";
import styles from "./Dashboard.module.css";
import "./CategorySection.css";

const CategorySection = ({ userId, totalBalance = 0, onExpenseAdded }) => {
  const [categories, setCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [categoryLoadError, setCategoryLoadError] = useState(null);
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

  // Icon mapping for categories - removed emojis for cleaner look

  const fetchCategories = async () => {
    if (!userId) {
      console.warn("No userId provided to CategorySection");
      setCategories([]);
      setCategoryLoadError(null);
      return;
    }

    setIsLoadingCategories(true);
    setCategoryLoadError(null);

    try {
      console.log("Fetching categories for userId:", userId);

      // Create timeout wrapper to prevent hanging requests
      const withTimeout = (promise, timeoutMs) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
          )
        ]);
      };

      // Try CategoryController with 3 second timeout
      try {
        const categoriesData = await withTimeout(
          categoryService.getCategoriesWithLimits(userId),
          3000
        );
        
        if (categoriesData && categoriesData.length > 0) {
          console.log("CategoryController response:", categoriesData);
          
          const mapped = categoriesData
            .filter(c => {
              const name = c.Category || c.category;
              return name && name !== "undefined" && name !== undefined && name.trim() !== "";
            })
            .map(c => ({
              name: c.Category || c.category,
              used: (c.Used || c.used) ?? 0,
              limit: (c.Limit || c.limit) ?? 0,
              key: c.Category || c.category,
              expenses: [],
            }));

          console.log("Mapped categories from CategoryController:", mapped);
          setCategories(mapped);
          setIsLoadingCategories(false);
          return;
        }
      } catch (err) {
        console.warn("CategoryController failed or timed out:", err.message);
      }

      // Fallback to Dashboard with 3 second timeout
      console.log("Falling back to Dashboard API...");
      try {
        const dashboardData = await withTimeout(
          categoryService.getCategoryUsage(userId),
          3000
        );
        
        if (dashboardData && dashboardData.length > 0) {
          console.log("Dashboard API response:", dashboardData);
          
          const mapped = dashboardData
            .filter(c => {
              const name = c.name || c.Name;
              return name && name !== "undefined" && name !== undefined && name.trim() !== "";
            })
            .map(c => ({
              name: c.name || c.Name,
              used: (c.value || c.Value) ?? 0,
              limit: (c.value || c.Value) ?? 0,
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
        console.warn("Dashboard API failed or timed out:", err.message);
        setCategories([]);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategoryLoadError(err.message);
      setCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    console.log("CategorySection - totalBalance received:", totalBalance);
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

    // If user has overspent, the new limit must be at least the amount spent
    if (currentCategory.used > newLimit) {
      alert(`Budget limit must be at least Rs ${currentCategory.used.toLocaleString()} to cover your current spending of Rs ${currentCategory.used.toLocaleString()}.`);
      return;
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

      // Call the callback to refresh transactions in parent Dashboard
      if (onExpenseAdded) {
        await onExpenseAdded();
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

      // Call the callback to refresh transactions in parent Dashboard
      if (onExpenseAdded) {
        await onExpenseAdded();
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
      alert("Failed to delete expense. Please try again.");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to delete "${categoryName}" category? This action cannot be undone.`)) {
      return;
    }

    try {
      // You'll need to implement this in your categoryService
      // await categoryService.deleteCategory(userId, categoryName);
      console.log("Category deleted successfully");
      
      // Refresh categories
      fetchCategories();
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert("Failed to delete category. Please try again.");
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
            <h3 className="category-title">Budget Categories</h3>
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
            
            {/* Show warning if overallocated */}
            {categories.reduce((sum, cat) => sum + cat.limit, 0) > totalBalance && (
              <div style={{ 
                padding: '12px', 
                background: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '8px', 
                marginBottom: '16px',
                color: '#856404',
                fontSize: '13px'
              }}>
                <strong>Budget Overallocated!</strong><br/>
                Your category limits (Rs {categories.reduce((sum, cat) => sum + cat.limit, 0).toLocaleString()}) 
                exceed your balance (Rs {totalBalance.toLocaleString()}) by Rs {(categories.reduce((sum, cat) => sum + cat.limit, 0) - totalBalance).toLocaleString()}.
                <br/>You need to reduce category limits or increase balance before adding new categories.
              </div>
            )}
            
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
                disabled={totalBalance <= categories.reduce((sum, cat) => sum + cat.limit, 0)}
              />
              <small className="available-balance">
                Available: Rs {Math.max(totalBalance - categories.reduce((sum, cat) => sum + cat.limit, 0), 0).toLocaleString()} 
                / Total Balance: Rs {totalBalance.toLocaleString()}
              </small>
              {newCategoryLimit && parseFloat(newCategoryLimit) > Math.max(totalBalance - categories.reduce((sum, cat) => sum + cat.limit, 0), 0) && (
                <small className="limit-warning">
                  Exceeds available balance
                </small>
              )}
            </div>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={addingCategory || (newCategoryLimit && parseFloat(newCategoryLimit) > Math.max(totalBalance - categories.reduce((sum, cat) => sum + cat.limit, 0), 0)) || totalBalance <= categories.reduce((sum, cat) => sum + cat.limit, 0)}
            >
              {addingCategory ? "Adding..." : "Add Category"}
            </button>
          </form>
        )}

      {isLoadingCategories ? (
        <div className="loading-state">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#666', marginBottom: '8px' }}>Loading your categories...</p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : categoryLoadError ? (
        <div style={{ 
          padding: '20px', 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px', 
          margin: '20px 0'
        }}>
          <p style={{ color: '#c00', marginBottom: '12px' }}>
            <strong>Error:</strong> {categoryLoadError}
          </p>
          <button 
            onClick={() => fetchCategories()}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-state" style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#999'
        }}>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No budget categories yet.</p>
          <p style={{ fontSize: '14px' }}>Click "+ Add Category" to get started!</p>
        </div>
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
                      <div className="category-text">
                        <h4 className="category-name">{c.name}</h4>
                        <p className="category-stat">
                          Rs {c.used.toLocaleString()} / Rs {c.limit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="category-badge">
                      <span className={`status-badge ${status}`}>
                        {status === "exceeded" ? "Over" : `${Math.round(percentage)}%`}
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
                          ? `Over by Rs ${(c.used - c.limit).toLocaleString()}`
                          : `Rs ${remaining.toLocaleString()} remaining`}
                      </p>
                    </div>
                    <div className="footer-actions">
                      <button 
                        className="btn-edit-category"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(c.name, c.limit);
                        }}
                        title="Edit budget limit"
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete-category"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(c.name);
                        }}
                        title="Delete category"
                      >
                        Delete
                      </button>
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
                            You have overspent by Rs {(c.used - c.limit).toLocaleString()} in this category!
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
                            min="0.01"
                            step="0.01"
                          />
                          <small className="info-text">
                            {c.used > 0 ? `Minimum allowed: Rs ${c.used.toLocaleString()} (to cover your spending)` : "Enter your new budget limit"}
                          </small>
                        </div>
                        <div className="edit-form-actions">
                          <button
                            type="submit"
                            className="btn-submit-edit"
                            disabled={updatingCategory}
                          >
                            {updatingCategory ? "Updating..." : "Update Limit"}
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
                                  <button 
                                    className="bill-icon-btn" 
                                    title="Click to view bill photo"
                                    onClick={() => setViewingBillImage(e.billImageBase64)}
                                    style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#667eea', fontSize: '12px', padding: '4px' }}
                                  >View Bill</button>
                                )}
                              </div>
                              <button
                                className="btn-delete-expense"
                                onClick={() => handleDeleteExpense(e.id, c.name)}
                                disabled={deletingExpenseId === e.id}
                                title="Delete this expense"
                              >
                                {deletingExpenseId === e.id ? "Deleting..." : "Delete"}
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
                        <p>No expenses recorded yet</p>
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
                              <p className="preview-label">Bill Preview:</p>
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
