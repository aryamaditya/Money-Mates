/**
 * healthScoreService.js
 * Calculates Financial Health Score based on three key metrics:
 * 1. Savings Ratio (35%)
 * 2. Budget Adherence (35%)
 * 3. Expense Ratio (30%)
 */

const API_BASE_URL = "http://localhost:5262/api";

const healthScoreService = {
  /**
   * Calculate Savings Ratio Score
   * Savings Ratio = (Total Savings / Total Income) × 100
   * 
   * Score mapping:
   * - > 50% savings    = 95-100 (Excellent)
   * - 30-50% savings   = 80-95  (Good)
   * - 10-30% savings   = 60-80  (Fair)
   * - 0-10% savings    = 40-60  (Poor)
   * - Negative savings = 0-40   (Critical)
   */
  calculateSavingsRatioScore: (totalIncome, totalExpenses) => {
    if (totalIncome === 0) return 0;

    const totalSavings = totalIncome - totalExpenses;
    const savingsRatio = (totalSavings / totalIncome) * 100;

    let score = 0;
    if (savingsRatio > 50) {
      score = 95 + (Math.min(savingsRatio - 50, 50) / 50) * 5;
    } else if (savingsRatio >= 30) {
      score = 80 + ((savingsRatio - 30) / 20) * 15;
    } else if (savingsRatio >= 10) {
      score = 60 + ((savingsRatio - 10) / 20) * 20;
    } else if (savingsRatio >= 0) {
      score = 40 + (savingsRatio / 10) * 20;
    } else {
      score = Math.max(0, 40 + (savingsRatio / 10) * 40);
    }

    return Math.round(score);
  },

  /**
   * Calculate Expense Ratio Score
   * Expense Ratio = (Total Expenses / Total Income) × 100
   * 
   * Score mapping:
   * - < 50% spent      = 90-100 (Excellent)
   * - 50-70% spent     = 75-90  (Good)
   * - 70-85% spent     = 60-75  (Fair)
   * - 85-100% spent    = 40-60  (Poor)
   * - > 100% spent     = 0-40   (Critical)
   */
  calculateExpenseRatioScore: (totalIncome, totalExpenses) => {
    if (totalIncome === 0) return 0;

    const expenseRatio = (totalExpenses / totalIncome) * 100;

    let score = 0;
    if (expenseRatio < 50) {
      score = 90 + (((50 - expenseRatio) / 50) * 10);
    } else if (expenseRatio < 70) {
      score = 75 + (((70 - expenseRatio) / 20) * 15);
    } else if (expenseRatio < 85) {
      score = 60 + (((85 - expenseRatio) / 15) * 15);
    } else if (expenseRatio < 100) {
      score = 40 + (((100 - expenseRatio) / 15) * 20);
    } else {
      score = Math.max(0, 40 - ((expenseRatio - 100) / 100) * 40);
    }

    return Math.round(score);
  },

  /**
   * Calculate Budget Adherence Score
   * For each category: Adherence = (Spent / Budget Limit) × 100
   * Overall: Average of all categories
   * 
   * Score mapping:
   * - < 80% of budget  = 90-100 (Excellent - under budget)
   * - 80-100% of budget = 75-90  (Good - on track)
   * - 100-120% of budget = 50-75 (Fair - slightly over)
   * - > 120% of budget = 0-50   (Poor - significantly over)
   */
  calculateBudgetAdherenceScore: (categoryExpenses, budgetLimits) => {
    if (!budgetLimits || budgetLimits.length === 0) {
      return 75; // Default score if no budgets set
    }

    let totalAdherenceScore = 0;
    let categoryCount = 0;

    budgetLimits.forEach((budget) => {
      const spent = categoryExpenses.find(
        (exp) => exp.category.toLowerCase() === budget.category.toLowerCase()
      )?.total || 0;

      const adherenceRatio = (spent / budget.limit) * 100;

      let categoryScore = 0;
      if (adherenceRatio < 80) {
        categoryScore = 90 + (((80 - adherenceRatio) / 80) * 10);
      } else if (adherenceRatio <= 100) {
        categoryScore = 75 + (((100 - adherenceRatio) / 20) * 15);
      } else if (adherenceRatio <= 120) {
        categoryScore = 50 + (((120 - adherenceRatio) / 20) * 25);
      } else {
        categoryScore = Math.max(0, 50 - ((adherenceRatio - 120) / 100) * 50);
      }

      totalAdherenceScore += categoryScore;
      categoryCount++;
    });

    return categoryCount > 0 ? Math.round(totalAdherenceScore / categoryCount) : 75;
  },

  /**
   * Calculate Overall Financial Health Score
   * Weighted average of three metrics:
   * - Savings Ratio: 35%
   * - Budget Adherence: 35%
   * - Expense Ratio: 30%
   */
  calculateOverallHealthScore: (savingsScore, budgetScore, expenseScore) => {
    const overall =
      savingsScore * 0.35 + budgetScore * 0.35 + expenseScore * 0.3;
    return Math.round(overall);
  },

  /**
   * Get health status label and color based on score
   */
  getHealthStatus: (score) => {
    if (score >= 90) {
      return { status: "Excellent", color: "#27ae60", icon: "🟢" };
    } else if (score >= 80) {
      return { status: "Good", color: "#2ecc71", icon: "🟢" };
    } else if (score >= 70) {
      return { status: "Fair", color: "#f39c12", icon: "🟡" };
    } else if (score >= 60) {
      return { status: "Poor", color: "#e67e22", icon: "🟠" };
    } else {
      return { status: "Critical", color: "#e74c3c", icon: "🔴" };
    }
  },

  /**
   * Fetch all required data and calculate financial health
   * Returns comprehensive health report with all metrics
   */
  calculateFinancialHealth: async (userId) => {
    try {
      // Fetch required data in parallel
      const [expenses, incomes, categoryData, budgets] = await Promise.all([
        fetch(`${API_BASE_URL}/expenses/${userId}`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/income/${userId}`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/dashboard/categories/${userId}`).then((r) =>
          r.json()
        ),
        fetch(`${API_BASE_URL}/budget/${userId}`).then((r) => r.json()),
      ]);

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Filter transactions by current month
      const filterByMonth = (transactions) => {
        if (!Array.isArray(transactions)) return [];
        return transactions.filter((tx) => {
          const txDate = new Date(tx.dateAdded || tx.date);
          return txDate >= startOfMonth && txDate <= endOfMonth;
        });
      };

      const currentMonthExpenses = filterByMonth(expenses || []);
      const currentMonthIncomes = filterByMonth(incomes || []);

      // Calculate totals
      const totalExpenses = currentMonthExpenses.reduce(
        (sum, exp) => sum + (exp.amount || 0),
        0
      );
      const totalIncome = currentMonthIncomes.reduce(
        (sum, inc) => sum + (inc.amount || 0),
        0
      );

      // Calculate individual scores using object references
      const savingsScore = healthScoreService.calculateSavingsRatioScore(totalIncome, totalExpenses);
      const expenseScore = healthScoreService.calculateExpenseRatioScore(totalIncome, totalExpenses);

      // Group expenses by category for budget adherence
      const categoryExpenses = currentMonthExpenses.reduce((acc, exp) => {
        const existing = acc.find((c) => c.category === exp.category);
        if (existing) {
          existing.total += exp.amount;
        } else {
          acc.push({ category: exp.category, total: exp.amount });
        }
        return acc;
      }, []);

      const budgetScore = healthScoreService.calculateBudgetAdherenceScore(
        categoryExpenses,
        budgets || []
      );

      // Calculate overall score
      const overallScore = healthScoreService.calculateOverallHealthScore(
        savingsScore,
        budgetScore,
        expenseScore
      );

      const status = healthScoreService.getHealthStatus(overallScore);

      return {
        overallScore,
        status,
        metrics: {
          savings: {
            score: savingsScore,
            label: "Savings Ratio",
            weight: 35,
            details: {
              totalIncome,
              totalExpenses,
              totalSavings: totalIncome - totalExpenses,
              savingsPercentage: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
            },
          },
          budget: {
            score: budgetScore,
            label: "Budget Adherence",
            weight: 35,
            details: {
              categoriesTracked: budgets?.length || 0,
              categoryBreakdown: categoryExpenses,
            },
          },
          expense: {
            score: expenseScore,
            label: "Expense Ratio",
            weight: 30,
            details: {
              totalExpenses,
              totalIncome,
              expensePercentage: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
            },
          },
        },
        summary: {
          totalIncome,
          totalExpenses,
          totalSavings: totalIncome - totalExpenses,
          month: startOfMonth.toLocaleString("en-IN", {
            month: "long",
            year: "numeric",
          }),
        },
      };
    } catch (error) {
      console.error("Error calculating financial health:", error);
      throw error;
    }
  },
};

export default healthScoreService;
