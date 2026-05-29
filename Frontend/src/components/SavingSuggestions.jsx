import React, { useEffect, useState } from 'react';
import { FaLightbulb, FaBullseye, FaArrowDown, FaPiggyBank, FaChartBar } from 'react-icons/fa';
import styles from './SavingSuggestions.module.css';
import expenseService from '../services/expenseService';
import budgetService from '../services/budgetService';
import incomeService from '../services/incomeService';

const SavingSuggestions = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [totalMonthlySavings, setTotalMonthlySavings] = useState(0);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);

  // Generate Smart Saving Tips via Groq (general financial advice only, no app features)
  const generateSmartTips = async (categoryAnalysis) => {
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) {
        console.warn('Groq API key not found in environment variables');
        return null;
      }

      const prompt = `All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol not $.

You are a financial advisor AI. Based on this spending analysis, provide 5 practical, actionable financial tips for saving money.

⚠️ CRITICAL: DO NOT mention any app features, UI elements, buttons, or settings. Only provide general financial advice.
❌ BANNED PHRASES: "Delete All", "feature", "button", "chart", "screen", "app", "interface", "menu", "dashboard"
✅ ALLOWED: General financial strategies, budgeting tips, spending habits, savings techniques

Spending Analysis:
${JSON.stringify(categoryAnalysis, null, 2)}

Return ONLY a valid JSON array with this structure (no markdown, no extra text):
[
  {
    "tip": "Brief financial tip (one line, max 12 words)"
  }
]

Guideliness:
- Each tip must be actionable and general financial advice
- Tips should be practical and universally applicable
- NO app-specific instructions or feature references whatsoever
- Focus on real-world financial management strategies`;

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
          max_tokens: 500
        })
      });

      if (!response.ok) {
        console.error('Groq API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        // Parse JSON from response
        const jsonMatch = content.match(/\[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return null;
    } catch (err) {
      console.error('Error generating smart tips:', err);
      return null;
    }
  };

  // Call Groq API for AI-generated suggestions
  const callGroqAPI = async (analysisData) => {
    try {
      const apiKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!apiKey) {
        console.warn('Groq API key not found in environment variables');
        return null;
      }

      const prompt = `All monetary amounts are in Nepali Rupees (Rs.) - use Rs. symbol not $.

You are a financial advisor AI. Based on the following spending analysis, provide 3-5 specific, actionable saving suggestions.

CRITICAL INSTRUCTION:
⚠️ ONLY suggest reducing a spending category if the current month spending EXCEEDS the three-month average.
⚠️ Do NOT suggest reducing any category where current spending is AT or BELOW the historical average.
⚠️ For categories where current spending is BELOW average, suggest maintaining or continuing the good control, or redirect advice to other high-spending categories.

SPENDING DATA:
${JSON.stringify(analysisData, null, 2)}

Return ONLY a valid JSON array with this structure (no markdown, no extra text):
[
  {
    "title": "Suggestion title",
    "description": "Detailed advice with specific actions",
    "category": "Category name",
    "priority": "High|Medium|Low",
    "savingsAmount": 1000,
    "reasoning": "Why this will save money"
  }
]

Guidelines:
- High priority: Category spending >30% above its 3-month average OR >20% of total budget
- Medium priority: Category spending 15-30% above its 3-month average
- Low priority: Optimization opportunities in lower-spending categories
- IGNORE categories where currentMonthSpending <= threeMonthAverage (these are already under control)
- Provide specific action steps, not generic advice
- Calculate realistic savings amounts based on reducing overspending to the 3-month average
- All currency in descriptions must use 'Rs.' symbol`;

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
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        console.error('Groq API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      return null;
    } catch (err) {
      console.error('Error calling Groq API:', err);
      return null;
    }
  };

  // Generate suggestions using AI with fallback to rules engine
  const generateSavingSuggestions = async (analysis, currentMonthExpenses, budgetLimits, totalIncome) => {
    try {
      setAiLoading(true);

      // Prepare analysis data for AI
      const analysisData = {
        categories: Object.entries(analysis).map(([name, data]) => ({
          name,
          threeMonthAverage: parseFloat(data.avg.toFixed(2)),
          currentMonthSpending: parseFloat(
            (currentMonthExpenses
              .filter(exp => (exp.category || 'Other') === name)
              .reduce((sum, exp) => sum + exp.amount, 0))
              .toFixed(2)
          ),
          budgetLimit: budgetLimits[name] || null
        })),
        totalCurrentMonthSpending: parseFloat(
          currentMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)
        ),
        totalMonthlyIncome: parseFloat(totalIncome.toFixed(2))
      };

      // Call AI API
      const aiSuggestions = await callGroqAPI(analysisData);

      if (aiSuggestions && Array.isArray(aiSuggestions) && aiSuggestions.length > 0) {
        // Convert AI suggestions to component format
        return aiSuggestions.map((sugg, index) => ({
          id: `ai-suggestion-${index}`,
          category: sugg.category || 'General',
          type: 'ai-recommendation',
          title: sugg.title,
          description: sugg.description,
          savingsAmount: Math.round(sugg.savingsAmount || 0),
          severity: sugg.priority?.toLowerCase() === 'high' ? 'high' 
            : sugg.priority?.toLowerCase() === 'medium' ? 'medium' 
            : 'low',
          icon: sugg.priority?.toLowerCase() === 'high' ? FaPiggyBank
            : sugg.priority?.toLowerCase() === 'medium' ? FaArrowDown
            : FaChartBar,
          action: `Apply this suggestion (Est. savings: Rs ${Math.round(sugg.savingsAmount || 0).toLocaleString()})`,
          reasoning: sugg.reasoning
        }));
      }

      // Fallback to rules engine if AI fails
      console.log('AI suggestion failed, falling back to rules engine');
      return generateRulesEngineSuggestions(analysis, currentMonthExpenses);
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
      // Fallback to rules engine
      return generateRulesEngineSuggestions(analysis, currentMonthExpenses);
    } finally {
      setAiLoading(false);
    }
  };

  // Original rules-based suggestion engine (fallback)
  const generateRulesEngineSuggestions = (analysis, currentMonthExpenses) => {
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

        // Fetch budget limits and total income
        const budgets = await budgetService.getUserBudgets(userId);
        const totalIncomeData = await incomeService.getTotalIncome(userId);
        const totalIncome = parseFloat(totalIncomeData) || 0;

        // Create budget limits map
        const budgetLimits = {};
        if (budgets && Array.isArray(budgets)) {
          budgets.forEach(budget => {
            budgetLimits[budget.category] = budget.limit;
          });
        }

        // Generate AI suggestions with fallback to rules engine
        const generatedSuggestions = await generateSavingSuggestions(
          categoryAnalysis, 
          currentMonthExpenses,
          budgetLimits,
          totalIncome
        );
        
        setSuggestions(generatedSuggestions);

        // Calculate potential monthly savings
        const potentialSavings = generatedSuggestions.reduce((sum, sugg) => sum + sugg.savingsAmount, 0);
        setTotalMonthlySavings(potentialSavings);

        // Generate Smart Saving Tips
        setTipsLoading(true);
        const generatedTips = await generateSmartTips(categoryAnalysis);
        if (generatedTips && Array.isArray(generatedTips) && generatedTips.length > 0) {
          setTips(generatedTips);
        } else {
          // Fallback to default tips if Groq fails
          setTips([
            { tip: 'Track your spending daily to identify patterns' },
            { tip: 'Set category-wise budgets and stick to them' },
            { tip: 'Review monthly trends to understand spending habits' },
            { tip: 'Automate transfers to savings account on payday' },
            { tip: 'Practice the 50/30/20 budgeting rule' }
          ]);
        }
        setTipsLoading(false);

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

  if (loading || aiLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>{loading ? 'Analyzing your spending patterns...' : 'Generating AI suggestions...'}</p>
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
                  {suggestion.reasoning && (
                    <p className={styles.cardReasoning}>
                      <strong>Why:</strong> {suggestion.reasoning}
                    </p>
                  )}
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
        {tipsLoading ? (
          <p style={{ fontSize: '0.9rem', color: '#666' }}>Loading personalized tips...</p>
        ) : (
          <ul className={styles.tipsList}>
            {tips.length > 0 ? (
              tips.map((tip, index) => (
                <li key={index}>{tip.tip}</li>
              ))
            ) : (
              <li>Monitor your spending regularly for better financial health</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SavingSuggestions;
