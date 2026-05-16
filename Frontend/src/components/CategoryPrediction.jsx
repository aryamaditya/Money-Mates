 import React, { useState, useEffect } from 'react';
import { FaHistory, FaBullseye, FaChartLine, FaLightbulb, FaSync } from 'react-icons/fa';
import styles from './CategoryPrediction.module.css';
import LoadingScreen from './LoadingScreen';
import { toast } from './Toast';
import expenseService from '../services/expenseService';
import budgetService from '../services/budgetService';

const CategoryPrediction = ({ userId }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [history, setHistory] = useState([]);
  const [budgetInfo, setBudgetInfo] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [averageSpent, setAverageSpent] = useState(0);

  // Fetch all categories and budgets
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsInitialLoading(true);
        const expenses = await expenseService.getUserExpenses(userId);
        await budgetService.getUserBudgets(userId);

        // Extract unique categories
        const uniqueCategories = [...new Set(expenses.map(e => e.category || 'Other'))].sort();
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load categories');
        toast.error('Failed to load categories');
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (userId) {
      fetchInitialData();
    }
  }, [userId]);

  // Handle category selection and generate predictions
  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    setLoading(true);
    setError(null);

    try {
      // Get all expenses
      const allExpenses = await expenseService.getUserExpenses(userId);
      
      // Filter by selected category
      const categoryExpenses = allExpenses.filter(e => (e.category || 'Other') === category);
      
      // Calculate stats
      const total = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
      const avg = categoryExpenses.length > 0 ? total / categoryExpenses.length : 0;
      
      setHistory(categoryExpenses);
      setTotalSpent(total);
      setAverageSpent(avg);

      // Get budget for this category
      const budgets = await budgetService.getUserBudgets(userId);
      const categoryBudget = budgets.find(b => b.category === category);
      setBudgetInfo(categoryBudget);

      // Generate suggestions
      generateSuggestions(category, categoryExpenses, budgets, allExpenses);

      setLoading(false);
    } catch (err) {
      console.error('Error selecting category:', err);
      setError('Failed to load category data');
      toast.error('Failed to load category data');
      setLoading(false);
    }
  };

  const generateSuggestions = (category, categoryExpenses, budgets, allExpenses) => {
    const suggestions = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get current month expenses for budget remaining calculation
    const currentMonthExpenses = allExpenses.filter(
      e => e.dateAdded && new Date(e.dateAdded).getMonth() === currentMonth && 
           new Date(e.dateAdded).getFullYear() === currentYear
    );

    // Get budget for current category
    const categoryBudget = budgets.find(b => b.category === category);
    const totalBudget = categoryBudget?.limit || 10000; // Default budget
    const currentCategorySpent = currentMonthExpenses
      .filter(e => (e.category || 'Other') === category)
      .reduce((sum, e) => sum + e.amount, 0);
    const budgetRemaining = totalBudget - currentCategorySpent;

    // Suggestion 1: Continue with same category if budget available
    if (budgetRemaining > 0) {
      suggestions.push({
        id: 'continue-category',
        type: 'continue',
        title: `Continue with ${category}`,
        description: `You have Rs ${Math.round(budgetRemaining)} remaining in ${category} budget. Average spend is Rs ${Math.round(averageSpent)}/transaction.`,
        suggestedAmount: Math.min(Math.round(averageSpent), budgetRemaining),
        category: category,
        icon: FaBullseye,
        action: `Spend up to Rs ${Math.round(budgetRemaining)} on ${category}`
      });
    }

    // Get other categories with available budget
    const otherCategoriesWithBudget = budgets
      .filter(b => b.category !== category)
      .map(b => {
        const spent = currentMonthExpenses
          .filter(e => (e.category || 'Other') === b.category)
          .reduce((sum, e) => sum + e.amount, 0);
        const remaining = b.limit - spent;
        return { ...b, spent, remaining };
      })
      .filter(b => b.remaining > 0)
      .sort(() => Math.random() - 0.5) // Random order
      .slice(0, 3); // Top 3 random categories

    // Suggestion 2: Switch to alternative category with budget
    otherCategoriesWithBudget.forEach((altBudget, index) => {
      suggestions.push({
        id: `alternative-${index}`,
        type: 'alternative',
        title: `Explore ${altBudget.category}`,
        description: `You have Rs ${Math.round(altBudget.remaining)} remaining in ${altBudget.category}. This is a good opportunity to diversify your spending.`,
        suggestedAmount: Math.min(Math.round(altBudget.remaining * 0.3), altBudget.remaining), // Suggest 30% of remaining
        category: altBudget.category,
        icon: FaChartLine,
        action: `Try Rs ${Math.round(Math.min(altBudget.remaining * 0.3, altBudget.remaining))} on ${altBudget.category}`
      });
    });

    // Suggestion 3: Smart spend based on patterns
    if (categoryExpenses.length >= 2) {
      const sortedByAmount = [...categoryExpenses].sort((a, b) => b.amount - a.amount);
      const topSpend = sortedByAmount[0].amount;
      const lowSpend = sortedByAmount[sortedByAmount.length - 1].amount;
      const midSpend = (topSpend + lowSpend) / 2;

      if (budgetRemaining > midSpend) {
        suggestions.push({
          id: 'smart-spend',
          type: 'smart',
          title: `Smart Spending for ${category}`,
          description: `Based on your history, moderate spending is Rs ${Math.round(midSpend)}. This is between your low (Rs ${Math.round(lowSpend)}) and high (Rs ${Math.round(topSpend)}) spending.`,
          suggestedAmount: Math.round(midSpend),
          category: category,
          icon: FaLightbulb,
          action: `Try Rs ${Math.round(midSpend)} - a balanced approach`
        });
      }
    }

    setSuggestions(suggestions);
  };

  const handleRefreshSuggestions = () => {
    if (selectedCategory) {
      handleCategorySelect(selectedCategory);
    }
  };

  if (isInitialLoading) {
    return <LoadingScreen message="Loading categories..." inline={true} />;
  }

  if (!selectedCategory && categories.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>No categories found. Add some expenses first!</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Category Prediction & Insights</h2>
        <p>Select a category to view history and get spending suggestions</p>
      </div>

      {/* Category Selection */}
      <div className={styles.categorySelector}>
        <label>Select Category:</label>
        <select 
          value={selectedCategory} 
          onChange={(e) => handleCategorySelect(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Choose a category --</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {selectedCategory && loading && (
        <LoadingScreen message="Analyzing category data..." inline={true} />
      )}

      {selectedCategory && !loading && (
        <>
          {/* Category Stats */}
          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <FaHistory className={styles.statIcon} />
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Total Transactions</span>
                <span className={styles.statValue}>{history.length}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <FaChartLine className={styles.statIcon} />
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Total Spent</span>
                <span className={styles.statValue}>Rs {totalSpent.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <FaBullseye className={styles.statIcon} />
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Average Spend</span>
                <span className={styles.statValue}>Rs {Math.round(averageSpent).toLocaleString()}</span>
              </div>
            </div>

            {budgetInfo && (
              <div className={styles.statCard}>
                <FaLightbulb className={styles.statIcon} />
                <div className={styles.statContent}>
                  <span className={styles.statLabel}>Monthly Budget</span>
                  <span className={styles.statValue}>Rs {budgetInfo.limit.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Recent History */}
          <div className={styles.historySection}>
            <h3>Recent Transactions ({history.slice(0, 5).length})</h3>
            {history.length > 0 ? (
              <div className={styles.transactionList}>
                {history.slice(0, 5).map((exp, idx) => (
                  <div key={idx} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <span className={styles.transactionDate}>
                        {new Date(exp.dateAdded).toLocaleDateString()}
                      </span>
                      <span className={styles.transactionDesc}>{exp.description}</span>
                    </div>
                    <span className={styles.transactionAmount}>
                      Rs {exp.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noData}>No transactions in this category</p>
            )}
          </div>

          {/* Suggestions */}
          <div className={styles.suggestionsSection}>
            <div className={styles.suggestionsHeader}>
              <h3>Smart Spending Suggestions</h3>
              <button 
                className={styles.refreshBtn}
                onClick={handleRefreshSuggestions}
                title="Get new random suggestions"
              >
                <FaSync /> Refresh
              </button>
            </div>

            {suggestions.length > 0 ? (
              <div className={styles.suggestionsList}>
                {suggestions.map(sugg => {
                  const IconComponent = sugg.icon;
                  return (
                    <div key={sugg.id} className={`${styles.suggestionCard} ${styles[sugg.type]}`}>
                      <div className={styles.suggestionIcon}>
                        <IconComponent />
                      </div>
                      <div className={styles.suggestionContent}>
                        <h4>{sugg.title}</h4>
                        <p>{sugg.description}</p>
                        <div className={styles.suggestionFooter}>
                          <span className={styles.suggestedAmount}>
                            Suggested: Rs {sugg.suggestedAmount.toLocaleString()}
                          </span>
                          <span className={styles.action}>{sugg.action}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.noSuggestions}>No suggestions available for this category</p>
            )}
          </div>
        </>
      )}

      {loading && (
        <div className={styles.loadingContainer}>
          <p>Loading category data...</p>
        </div>
      )}
    </div>
  );
};

export default CategoryPrediction;
