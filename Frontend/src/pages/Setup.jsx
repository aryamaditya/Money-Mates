import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Setup.css";

export default function Setup() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [totalBudget, setTotalBudget] = useState("");
  const [budgetSet, setBudgetSet] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  // Remaining budget calculation
  const remainingBudget =
    budgetSet
      ? totalBudget -
        categories.reduce((sum, c) => sum + (parseFloat(c.limit) || 0), 0)
      : 0;

  // Set total monthly budget
  const handleSetBudget = () => {
    const budgetNum = parseFloat(totalBudget);
    if (!budgetNum || budgetNum <= 0) {
      setError("Please enter a valid budget.");
      return;
    }
    setBudgetSet(true);
    setError("");
  };

  // Add new category
  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.find((c) => c.name === newCategory.trim())) return;
    setCategories([...categories, { name: newCategory.trim(), limit: "" }]);
    setNewCategory("");
  };

  // Set category limit
  const handleSetLimit = (index, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return;

    const currentSum = categories.reduce((sum, c, i) => {
      if (i === index) return sum;
      return sum + (parseFloat(c.limit) || 0);
    }, 0);

    if (num + currentSum > totalBudget) {
      alert(
        `Limit exceeds remaining budget! You have $${totalBudget - currentSum} left.`
      );
      return;
    }

    const updated = [...categories];
    updated[index].limit = num;
    setCategories(updated);
  };

  // Delete category
  const handleDelete = (index) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
  };

  // Submit all budgets
  const handleSubmit = async () => {
    // Validation: all categories must have a limit
    for (let cat of categories) {
      if (!cat.limit || cat.limit <= 0) {
        setError(`Please set a valid limit for "${cat.name}"`);
        return;
      }
    }

    try {
      // Save each category to backend
      for (let cat of categories) {
        await fetch(`https://localhost:7167/api/Budget`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.userID,
            category: cat.name,
            limit: cat.limit,
          }),
        });
      }

      // Mark first login complete
      await fetch(`https://localhost:7167/api/users/complete-setup/${user.userID}`, {
        method: "POST",
      });

      // Update localStorage
      user.isFirstLogin = false;
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Failed to save setup. Try again.");
    }
  };

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h1>Welcome, {user.name}!</h1>
        <p>Set your monthly budget and allocate it to categories.</p>

        {/* Step 1: Total Budget */}
        {!budgetSet && (
          <div className="budget-step">
            <input
              type="number"
              placeholder="Enter your monthly budget"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
            />
            <button onClick={handleSetBudget}>Set Budget</button>
          </div>
        )}

        {/* Step 2: Categories */}
        {budgetSet && (
          <div className="categories-step">
            <p>
              Total Budget: ${totalBudget} | Remaining: ${remainingBudget}
            </p>

            <div className="category-input">
              <input
                type="text"
                placeholder="Add new category"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <button type="button" onClick={handleAddCategory}>
                Add Category
              </button>
            </div>

            <ul className="category-list">
              {categories.map((cat, index) => (
                <li key={index} className="category-item">
                  <span>{cat.name}</span>
                  <input
                    type="number"
                    placeholder={`Limit for ${cat.name}`}
                    value={cat.limit}
                    onChange={(e) => handleSetLimit(index, e.target.value)}
                  />
                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() => handleDelete(index)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>

            <button className="btn-primary" type="button" onClick={handleSubmit}>
              Complete Setup
            </button>
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
