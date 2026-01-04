import React, { useEffect, useState } from "react";
import categoryService from "../../services/categoryService";
import styles from "./Dashboard.module.css";

const CategorySection = ({ userId }) => {
  const [categories, setCategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Hardcoded limits for now (replace with backend GET later if allowed)
  const BUDGET_LIMITS = {
    Food: 2000,
    Transport: 500,
    Entertainment: 300,
  };

  const fetchCategories = async () => {
    if (!userId) return;

    try {
      // Fetch usage from Dashboard API (already works)
      const usage = await categoryService.getCategoryUsage(userId);

      // Merge usage with limits
      const merged = usage
        .filter(u => u.name && u.name !== "undefined") // remove invalid categories
        .map(u => ({
          name: u.name,
          used: u.value,
          limit: BUDGET_LIMITS[u.name] || 0,
          key: u.name,
          expenses: [], // will fetch on expand if needed
        }));

      setCategories(merged);
    } catch (err) {
      console.error("Failed to load categories:", err);
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

  return (
    <div className={styles.mainCard}>
      <h3 className={styles.cardTitle}>Category Limits</h3>
      <table className={styles.categoryTable}>
        <thead>
          <tr>
            <th>Category</th>
            <th>Limit</th>
            <th>Used</th>
          </tr>
        </thead>
        <tbody>
          {categories.length === 0 ? (
            <tr><td colSpan={3}>Loading categories...</td></tr>
          ) : (
            categories.map(c => (
              <React.Fragment key={c.key}>
                <tr
                  onClick={() => toggleCategory(c.name)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{c.name}</td>
                  <td>
                    <input
                      type="number"
                      value={c.limit}
                      readOnly
                      style={{ cursor: "not-allowed", backgroundColor: "#f0f0f0" }}
                    />
                  </td>
                  <td style={{ color: c.used > c.limit ? "red" : "black" }}>
                    {c.used}
                  </td>
                </tr>

                {expandedCategory === c.name && c.expenses.length > 0 && (
                  <tr>
                    <td colSpan={3}>
                      <table className={styles.expenseTable}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.expenses.map((e, idx) => (
                            <tr key={`${e.id}-${idx}`}>
                              <td>{new Date(e.dateAdded).toLocaleDateString()}</td>
                              <td>{e.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CategorySection;
