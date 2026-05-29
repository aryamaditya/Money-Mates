 import React, { useState, useEffect } from 'react';
import { FaHistory, FaBullseye, FaChartLine, FaLightbulb, FaSync } from 'react-icons/fa';
import styles from './CategoryPrediction.module.css';
import LoadingScreen from './LoadingScreen';
import { toast } from './Toast';
import expenseService from '../services/expenseService';
import budgetService from '../services/budgetService';
import incomeService from '../services/incomeService';

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
  const [aiLoading, setAiLoading] = useState(false);

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

      // Generate suggestions (now async with Groq AI)
      await generateSuggestions(category, categoryExpenses, budgets, allExpenses);

      setLoading(false);
    } catch (err) {
      console.error('Error selecting category:', err);
      setError('Failed to load category data');
      toast.error('Failed to load category data');
      setLoading(false);
    }
  };

  // Call Groq API to generate AI-powered suggestions
  const callGroqAPI = async (contextData) => {
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) {
        console.warn('Groq API key not found in environment variables');
        console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('GROQ') || k.includes('REACT')));
        return null;
      }
      console.log('Groq API key found, length:', apiKey.length);

      const prompt = `You are a financial advisor AI. Analyze this spending data and provide exactly 3 specific spending suggestions.

CRITICAL: You MUST respond with ONLY a valid JSON array. No other text before or after. No markdown formatting.

All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol.

CONTEXT DATA:
Selected Category: ${contextData.selectedCategory}
Current Month Spending: Rs ${contextData.currentMonthSpending}
Category Budget Limit: Rs ${contextData.budgetLimit}
Budget Remaining: Rs ${contextData.budgetRemaining}
Historical Average Transaction: Rs ${contextData.historicalAverage}
Highest Past Transaction: Rs ${contextData.highestTransaction}
Lowest Past Transaction: Rs ${contextData.lowestTransaction}
Total Monthly Income: Rs ${contextData.totalMonthlyIncome}
Last 5 Transactions:
${contextData.lastFiveTransactions.map(t => `- Rs ${t.amount} on ${new Date(t.dateAdded).toLocaleDateString()}`).join('\n')}

You MUST provide exactly 3 suggestions:
1. Continue - suggest continuing with this category and specify amount
2. Explore Alternative - suggest which other category and why
3. Smart Spend - balanced spending amount based on patterns

RESPONSE FORMAT (MUST BE VALID JSON):
[
  {
    "type": "Continue",
    "amount": 1500,
    "reasoning": "Brief explanation why this amount makes sense"
  },
  {
    "type": "Explore Alternative",
    "suggestedCategory": "CategoryName",
    "amount": 1000,
    "reasoning": "Why to explore this category"
  },
  {
    "type": "Smart Spend",
    "amount": 1200,
    "reasoning": "Balanced approach based on your patterns"
  }
]

CRITICAL RULES:
- ONLY return JSON array
- Exactly 3 objects, no more, no less
- Each object must have type, amount, reasoning
- Amount must be a number, not a string
- "Explore Alternative" must have suggestedCategory
- NO markdown backticks
- NO explanatory text before or after JSON`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      console.log('Groq API response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('Groq API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        console.log('Groq raw response:', content); // Debug: Log raw response
        // Parse JSON directly from response (already clean JSON array)
        try {
          const parsed = JSON.parse(content);
          console.log('Groq parsed suggestions:', parsed); // Debug: Log parsed result
          return parsed;
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr, 'Content:', content);
          return null;
        }
      }
      console.error('Unexpected response structure:', data);
      return null;
    } catch (err) {
      console.error('Error calling Groq API:', err);
      return null;
    }
  };

  const generateSuggestions = async (category, categoryExpenses, budgets, allExpenses) => {
    setAiLoading(true);
    const suggestions = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Calculate these variables outside try-catch so they're accessible everywhere
    const currentMonthExpenses = allExpenses.filter(
      e => e.dateAdded && new Date(e.dateAdded).getMonth() === currentMonth && 
           new Date(e.dateAdded).getFullYear() === currentYear
    );

    const categoryBudget = budgets.find(b => b.category === category);
    const totalBudget = categoryBudget?.limit || 10000;
    const currentCategorySpent = currentMonthExpenses
      .filter(e => (e.category || 'Other') === category)
      .reduce((sum, e) => sum + e.amount, 0);
    const budgetRemaining = totalBudget - currentCategorySpent;

    try {
      // Calculate transaction statistics
      const sortedByAmount = [...categoryExpenses].sort((a, b) => b.amount - a.amount);
      const highestTransaction = sortedByAmount.length > 0 ? sortedByAmount[0].amount : 0;
      const lowestTransaction = sortedByAmount.length > 0 ? sortedByAmount[sortedByAmount.length - 1].amount : 0;
      const historicalAverage = categoryExpenses.length > 0 
        ? categoryExpenses.reduce((sum, e) => sum + e.amount, 0) / categoryExpenses.length 
        : 0;

      // Get total monthly income
      const allIncome = await incomeService.getUserIncome(userId);
      const currentMonthIncome = allIncome.filter(
        i => i.dateAdded && new Date(i.dateAdded).getMonth() === currentMonth && 
             new Date(i.dateAdded).getFullYear() === currentYear
      ).reduce((sum, i) => sum + i.amount, 0);

      // Get last 5 transactions for context
      const lastFiveTransactions = categoryExpenses.slice(0, 5);

      // Prepare context data for Groq API
      const contextData = {
        selectedCategory: category,
        currentMonthSpending: currentCategorySpent,
        budgetLimit: totalBudget,
        budgetRemaining: budgetRemaining,
        historicalAverage: Math.round(historicalAverage),
        highestTransaction: highestTransaction,
        lowestTransaction: lowestTransaction,
        totalMonthlyIncome: currentMonthIncome,
        lastFiveTransactions: lastFiveTransactions
      };

      // Call Groq API
      const aiSuggestions = await callGroqAPI(contextData);

      if (aiSuggestions && Array.isArray(aiSuggestions) && aiSuggestions.length === 3) {
        console.log('AI suggestions received successfully:', aiSuggestions);
        // Convert AI suggestions to component format
        aiSuggestions.forEach((sugg, index) => {
          let icon, typeKey;
          
          if (sugg.type === 'Continue') {
            icon = FaBullseye;
            typeKey = 'continue';
            suggestions.push({
              id: `ai-continue-${index}`,
              type: typeKey,
              title: `Continue with ${category}`,
              description: sugg.reasoning,
              suggestedAmount: Math.round(sugg.amount),
              category: category,
              icon: icon,
              action: `Spend Rs ${Math.round(sugg.amount)} on ${category}`,
              aiGenerated: true
            });
          } else if (sugg.type === 'Explore Alternative') {
            icon = FaChartLine;
            typeKey = 'alternative';
            suggestions.push({
              id: `ai-alternative-${index}`,
              type: typeKey,
              title: `Explore ${sugg.suggestedCategory}`,
              description: sugg.reasoning,
              suggestedAmount: Math.round(sugg.amount),
              category: sugg.suggestedCategory || 'Other',
              icon: icon,
              action: `Try Rs ${Math.round(sugg.amount)} on ${sugg.suggestedCategory}`,
              aiGenerated: true
            });
          } else if (sugg.type === 'Smart Spend') {
            icon = FaLightbulb;
            typeKey = 'smart';
            suggestions.push({
              id: `ai-smart-${index}`,
              type: typeKey,
              title: `Smart Spending for ${category}`,
              description: sugg.reasoning,
              suggestedAmount: Math.round(sugg.amount),
              category: category,
              icon: icon,
              action: `Balanced approach: Rs ${Math.round(sugg.amount)}`,
              aiGenerated: true
            });
          }
        });

        setSuggestions(suggestions);
        setAiLoading(false);
        return;
      }

      // Fallback to rules-based approach if AI fails
      console.log('AI suggestion failed, falling back to rules-based approach');
      console.log('AI response details:', { aiSuggestions, isArray: Array.isArray(aiSuggestions), length: aiSuggestions?.length });
      generateRulesBasedSuggestions(category, categoryExpenses, budgets, currentMonthExpenses, budgetRemaining);
    } catch (err) {
      console.error('Error in generateSuggestions:', err);
      // Fallback to rules-based approach
      generateRulesBasedSuggestions(category, categoryExpenses, budgets, currentMonthExpenses, budgetRemaining);
    } finally {
      setAiLoading(false);
    }
  };

  const generateRulesBasedSuggestions = (category, categoryExpenses, budgets, currentMonthExpenses, budgetRemaining) => {
    const suggestions = [];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Get current month expenses for budget remaining calculation
    const currentCategorySpent = currentMonthExpenses
      .filter(e => (e.category || 'Other') === category)
      .reduce((sum, e) => sum + e.amount, 0);

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
        action: `Spend up to Rs ${Math.round(budgetRemaining)} on ${category}`,
        aiGenerated: false
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
      .sort(() => Math.random() - 0.5)
      .slice(0, 1);

    // Suggestion 2: Switch to alternative category with budget
    if (otherCategoriesWithBudget.length > 0) {
      const altBudget = otherCategoriesWithBudget[0];
      suggestions.push({
        id: `alternative-0`,
        type: 'alternative',
        title: `Explore ${altBudget.category}`,
        description: `You have Rs ${Math.round(altBudget.remaining)} remaining in ${altBudget.category}. This is a good opportunity to diversify your spending.`,
        suggestedAmount: Math.min(Math.round(altBudget.remaining * 0.3), altBudget.remaining),
        category: altBudget.category,
        icon: FaChartLine,
        action: `Try Rs ${Math.round(Math.min(altBudget.remaining * 0.3, altBudget.remaining))} on ${altBudget.category}`,
        aiGenerated: false
      });
    }

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
          action: `Try Rs ${Math.round(midSpend)} - a balanced approach`,
          aiGenerated: false
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
              <h3>Smart Spending Suggestions {aiLoading && <span className={styles.aiGeneration}>(AI Generating...)</span>}</h3>
              <button 
                className={styles.refreshBtn}
                onClick={handleRefreshSuggestions}
                title="Get new suggestions"
                disabled={aiLoading}
              >
                <FaSync /> Refresh
              </button>
            </div>

            {aiLoading ? (
              <LoadingScreen message="AI analyzing spending patterns..." inline={true} />
            ) : suggestions.length > 0 ? (
              <div className={styles.suggestionsList}>
                {suggestions.map(sugg => {
                  const IconComponent = sugg.icon;
                  return (
                    <div key={sugg.id} className={`${styles.suggestionCard} ${styles[sugg.type]}`}>
                      <div className={styles.suggestionIcon}>
                        <IconComponent />
                      </div>
                      <div className={styles.suggestionContent}>
                        <div className={styles.suggestionTitle}>
                          <h4>{sugg.title}</h4>
                          {sugg.aiGenerated && <span className={styles.aiBadge}>AI Generated</span>}
                        </div>
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
