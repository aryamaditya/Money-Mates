import React, { useEffect, useState } from 'react';
import { FaLightbulb, FaBullseye, FaArrowDown, FaPiggyBank, FaChartBar } from 'react-icons/fa';
import styles from './SavingSuggestions.module.css';
import expenseService from '../services/expenseService';

const SavingSuggestions = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [totalMonthlySavings, setTotalMonthlySavings] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      try {
        setLoading(true);
        const expenses = await expenseService.getUserExpenses(userId);

        if (!expenses || expenses.length === 0) {
          setLoading(false);
          return;
        }

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get last 3 months for analysis
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);

        // Filter expenses for current month
        const currentMonthExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.dateAdded);
          return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        });

        // Filter last 3 months
        const lastThreeMonthsExpenses = expenses.filter(exp => {
          const expDate = new Date(exp.dateAdded);
          return expDate >= threeMonthsAgo;
        });

        // Analyze spending by category
        const categoryAnalysis = {};
        lastThreeMonthsExpenses.forEach(exp => {
          const cat = exp.category || 'Other';
          if (!categoryAnalysis[cat]) {
            categoryAnalysis[cat] = { total: 0, count: 0, avg: 0 };
          }
          categoryAnalysis[cat].total += exp.amount;
          categoryAnalysis[cat].count += 1;
        });

        // Calculate averages
        Object.keys(categoryAnalysis).forEach(cat => {
          categoryAnalysis[cat].avg = categoryAnalysis[cat].total / 3; // 3 months average
        });

        // Generate suggestions
        const generatedSuggestions = generateSavingSuggestions(categoryAnalysis, currentMonthExpenses);
        
        setSuggestions(generatedSuggestions);

        // Calculate potential monthly savings
        const potentialSavings = generatedSuggestions.reduce((sum, sugg) => sum + sugg.savingsAmount, 0);
        setTotalMonthlySavings(potentialSavings);

        setLoading(false);
      } catch (err) {
        console.error('Error analyzing spending:', err);
        setError('Failed to generate suggestions');
        setLoading(false);
      }
    };

    if (userId) {
      fetchAndAnalyze();
    }
  }, [userId]);

  const generateSavingSuggestions = (analysis, currentMonthExpenses) => {
    const suggestions = [];
    const currentTotal = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    Object.keys(analysis).forEach(category => {
      const data = analysis[category];
      const currentCatSpending = currentMonthExpenses
        .filter(exp => (exp.category || 'Other') === category)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Suggestion 1: If spending is 30% above average, suggest reduction
      if (currentCatSpending > data.avg * 1.3) {
        const reduction = currentCatSpending - data.avg * 1.1;
        if (reduction > 0) {
          suggestions.push({
            id: `reduce-${category}`,
            category: category,
            type: 'reduce',
            title: `Reduce ${category} Spending`,
            description: `Your ${category} spending (Rs ${currentCatSpending.toLocaleString()}) is 30% higher than average. Consider reducing to Rs ${(data.avg * 1.1).toLocaleString()}.`,
            savingsAmount: reduction,
            severity: 'medium',
            icon: FaArrowDown,
            action: `Cut ${category} by ${((reduction / currentCatSpending) * 100).toFixed(0)}%`
          });
        }
      }

      // Suggestion 2: Identify high spending categories
      if (currentCatSpending > currentTotal / 5) {
        suggestions.push({
          id: `optimize-${category}`,
          category: category,
          type: 'optimize',
          title: `Optimize ${category} Expenses`,
          description: `${category} is one of your top spending categories. Small adjustments here could save Rs ${Math.round(currentCatSpending * 0.1)}/month.`,
          savingsAmount: Math.round(currentCatSpending * 0.1),
          severity: 'low',
          icon: FaChartBar,
          action: `Optimize to save Rs ${Math.round(currentCatSpending * 0.1)}/month`
        });
      }
    });

    // Suggestion 3: General saving goal
    const totalSpent = currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    if (totalSpent > 0) {
      const savingTargetAmount = Math.round(totalSpent * 0.15); // 15% saving goal
      suggestions.push({
        id: 'general-saving-goal',
        category: 'Overall',
        type: 'goal',
        title: 'Monthly Saving Goal',
        description: `Set a goal to save Rs ${savingTargetAmount.toLocaleString()} (15% of your monthly spending) by cutting non-essential expenses.`,
        savingsAmount: savingTargetAmount,
        severity: 'high',
        icon: FaPiggyBank,
        action: `Aim to save Rs ${savingTargetAmount.toLocaleString()}/month`
      });
    }

    // Sort by savings amount (highest first)
    return suggestions.sort((a, b) => b.savingsAmount - a.savingsAmount);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Analyzing your spending patterns...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FaLightbulb className={styles.headerIcon} />
          <div>
            <h2>Personalized Saving Suggestions</h2>
            <p>AI-powered recommendations based on your spending behavior</p>
          </div>
        </div>
        {totalMonthlySavings > 0 && (
          <div className={styles.savingsHighlight}>
            <div className={styles.savingsAmount}>
              Rs {totalMonthlySavings.toLocaleString()}
            </div>
            <div className={styles.savingsLabel}>Potential Monthly Savings</div>
          </div>
        )}
      </div>

      {suggestions.length === 0 ? (
        <div className={styles.noSuggestions}>
          <FaPiggyBank className={styles.emptyIcon} />
          <p>Keep up great work! Your spending is well-balanced.</p>
        </div>
      ) : (
        <div className={styles.suggestionsGrid}>
          {suggestions.map((suggestion) => {
            const IconComponent = suggestion.icon;
            return (
              <div 
                key={suggestion.id} 
                className={`${styles.suggestionCard} ${styles[`severity-${suggestion.severity}`]}`}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon}>
                    <IconComponent />
                  </div>
                  <div className={styles.severityBadge}>
                    {suggestion.severity === 'high' && '🔴 High Priority'}
                    {suggestion.severity === 'medium' && '🟡 Medium Priority'}
                    {suggestion.severity === 'low' && '🟢 Low Priority'}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{suggestion.title}</h3>
                  <p className={styles.cardDescription}>{suggestion.description}</p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.savingsInfo}>
                    <span className={styles.savingsLabel}>Potential Savings:</span>
                    <span className={styles.savingsAmount}>
                      Rs {suggestion.savingsAmount.toLocaleString()}
                    </span>
                  </div>
                  <button className={styles.actionBtn}>
                    {suggestion.action}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.tipsSection}>
        <div className={styles.tipsHeader}>
          <FaBullseye className={styles.tipsIcon} />
          <h3>Smart Saving Tips</h3>
        </div>
        <ul className={styles.tipsList}>
          <li>💡 Track your spending daily to identify patterns</li>
          <li>💡 Set category-wise budgets and stick to them</li>
          <li>💡 Use the "Delete All" feature to reset monthly budgets</li>
          <li>💡 Review your monthly comparison chart for trends</li>
          <li>💡 Automate transfers to savings account on payday</li>
        </ul>
      </div>
    </div>
  );
};

export default SavingSuggestions;
