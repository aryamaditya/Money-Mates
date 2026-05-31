import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { FaChartPie, FaRegLightbulb, FaChartLine, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import styles from './SpendingPatterns.module.css';
import expenseService from '../services/expenseService';
import budgetService from '../services/budgetService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#ff7300', '#d0ed57'];

const SpendingPatterns = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [overSpendingAlerts, setOverSpendingAlerts] = useState([]);
  const [topCategory, setTopCategory] = useState(null);
  const [allTimeTopCategory, setAllTimeTopCategory] = useState(null);
  const [totalHistoricalSpending, setTotalHistoricalSpending] = useState(0);
  const [previousMonthData, setPreviousMonthData] = useState([]);
  const [currentMonthName, setCurrentMonthName] = useState('');
  const [previousMonthName, setPreviousMonthName] = useState('');

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        setLoading(true);
        const [expenseData, budgetData] = await Promise.all([
          expenseService.getUserExpenses(userId),
          budgetService.getUserBudgets(userId)
        ]);
        
        if (!expenseData || expenseData.length === 0) {
          setExpenses([]);
          setBudgets(budgetData || []);
          setLoading(false);
          return;
        }

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Get previous month
        let previousMonth = currentMonth - 1;
        let previousYear = currentYear;
        if (previousMonth < 0) {
          previousMonth = 11;
          previousYear = currentYear - 1;
        }

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        setCurrentMonthName(monthNames[currentMonth]);
        setPreviousMonthName(monthNames[previousMonth]);

        // Filter expenses for current month only
        const currentMonthExpenses = expenseData.filter(exp => {
          const expDate = new Date(exp.dateAdded);
          return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        });

        // Filter expenses for previous month
        const previousMonthExpenses = expenseData.filter(exp => {
          const expDate = new Date(exp.dateAdded);
          return expDate.getMonth() === previousMonth && expDate.getFullYear() === previousYear;
        });

        // Process data for Category Pie Chart (CURRENT MONTH ONLY)
        const catMap = {};
        currentMonthExpenses.forEach(exp => {
          const cat = exp.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + exp.amount;
        });

        const cData = Object.keys(catMap).map(key => ({
          name: key,
          value: catMap[key]
        })).sort((a, b) => b.value - a.value);

        setCategoryData(cData);

        if (cData.length > 0) {
          setTopCategory(cData[0]);
        }

        // Process data for Previous Month Category Breakdown
        const prevCatMap = {};
        previousMonthExpenses.forEach(exp => {
          const cat = exp.category || 'Other';
          prevCatMap[cat] = (prevCatMap[cat] || 0) + exp.amount;
        });

        const prevCData = Object.keys(prevCatMap).map(key => ({
          name: key,
          value: prevCatMap[key]
        })).sort((a, b) => b.value - a.value);

        setPreviousMonthData(prevCData);

        // Process ALL-TIME category breakdown for comparison
        const allTimeCatMap = {};
        expenseData.forEach(exp => {
          const cat = exp.category || 'Other';
          allTimeCatMap[cat] = (allTimeCatMap[cat] || 0) + exp.amount;
        });

        const allTimeCData = Object.keys(allTimeCatMap).map(key => ({
          name: key,
          value: allTimeCatMap[key]
        })).sort((a, b) => b.value - a.value);

        if (allTimeCData.length > 0) {
          setAllTimeTopCategory(allTimeCData[0]);
        }

        const totalHistorical = allTimeCData.reduce((sum, cat) => sum + cat.value, 0);
        setTotalHistoricalSpending(totalHistorical);

        // Process data for Monthly Bar Chart (ALL TIME)
        const shortMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthMap = {};

        expenseData.forEach(exp => {
          const date = new Date(exp.dateAdded);
          const monthKey = `${shortMonthNames[date.getMonth()]} ${date.getFullYear()}`;
          const sortKey = date.getFullYear() * 100 + date.getMonth();

          if (!monthMap[monthKey]) {
            monthMap[monthKey] = { month: monthKey, sortKey, amount: 0 };
          }
          monthMap[monthKey].amount += exp.amount;
        });

        const mData = Object.values(monthMap)
          .sort((a, b) => a.sortKey - b.sortKey)
          .map(({ month, amount }) => ({ month, amount }));

        setMonthlyData(mData);
        setBudgets(budgetData || []);
        setExpenses(currentMonthExpenses);

        // Calculate overspending alerts (CURRENT MONTH ONLY)
        calculateOverSpendingAlerts(cData, budgetData || []);
      } catch (err) {
        console.error('Error fetching spending data:', err);
        setError('Failed to load spending data');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAndProcessData();
    }
  }, [userId]);

  // Calculate overspending for each category
  const calculateOverSpendingAlerts = (categoryData, budgetData) => {
    const alerts = [];

    categoryData.forEach(category => {
      const budget = budgetData.find(b => b.category?.toLowerCase() === category.name.toLowerCase());
      
      if (budget && category.value > budget.limit) {
        const overAmount = category.value - budget.limit;
        const percentOverage = ((overAmount / budget.limit) * 100).toFixed(1);
        
        alerts.push({
          category: category.name,
          spent: category.value,
          budget: budget.limit,
          overAmount,
          percentOverage,
          severity: percentOverage > 50 ? 'critical' : 'warning'
        });
      }
    });

    setOverSpendingAlerts(alerts.sort((a, b) => b.overAmount - a.overAmount));
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

  if (expenses.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <p>No expense data found to analyze.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Overspending Alerts */}
      {overSpendingAlerts.length > 0 && (
        <div className={styles.alertsSection}>
          <div className={styles.alertsHeader}>
            <FaExclamationTriangle className={styles.alertsIcon} />
            <h3>Budget Alerts</h3>
            <span className={styles.alertCount}>{overSpendingAlerts.length}</span>
          </div>
          
          <div className={styles.alertsGrid}>
            {overSpendingAlerts.map((alert, index) => (
              <div key={index} className={`${styles.alertCard} ${styles[`alert-${alert.severity}`]}`}>
                <div className={styles.alertTop}>
                  <div className={styles.alertCategory}>
                    <span className={styles.categoryName}>{alert.category}</span>
                    <span className={styles.severityBadge}>
                      {alert.severity === 'critical' ? 'Critical' : 'Warning'}
                    </span>
                  </div>
                </div>

                <div className={styles.alertProgressBar}>
                  <div className={styles.progressTrack}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${Math.min((alert.spent / alert.budget) * 100, 100)}%` }}
                    />
                  </div>
                  <span className={styles.progressLabel}>
                    {((alert.spent / alert.budget) * 100).toFixed(0)}% spent
                  </span>
                </div>

                <div className={styles.alertDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Budget:</span>
                    <span className={styles.detailValue}>Rs {alert.budget.toLocaleString()}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Spent:</span>
                    <span className={styles.detailValue}>Rs {alert.spent.toLocaleString()}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Over by:</span>
                    <span className={`${styles.detailValue} ${styles.overAmount}`}>
                      Rs {alert.overAmount.toLocaleString()} ({alert.percentOverage}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights Summary */}
      <div className={styles.insightsSection}>
        {overSpendingAlerts.length === 0 && budgets.length > 0 && (
          <div className={`${styles.insightCard} ${styles.successCard}`}>
            <div className={styles.insightIcon}>
              <FaCheckCircle />
            </div>
            <div className={styles.insightContent}>
              <h3>Budget Status: On Track</h3>
              <p>Great job! You're staying within budget for all categories. Keep up the good spending habits!</p>
            </div>
          </div>
        )}
        
        {topCategory && (
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>
              <FaRegLightbulb />
            </div>
            <div className={styles.insightContent}>
              <h3>This Month's Insight</h3>
              <p>Your top spending category this month is <strong>{topCategory.name}</strong> with <strong>Rs {topCategory.value.toLocaleString()}</strong>.</p>
            </div>
          </div>
        )}

        {allTimeTopCategory && (
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>
              <FaChartLine />
            </div>
            <div className={styles.insightContent}>
              <h3>Historical Insight</h3>
              <p>Your highest spending category overall is <strong>{allTimeTopCategory.name}</strong> with total <strong>Rs {allTimeTopCategory.value.toLocaleString()}</strong> spent.</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Current Month Category Breakdown Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.headerTitleSection}>
              <FaChartPie className={styles.headerIcon} />
              <div>
                <h3>This Month's Breakdown</h3>
                <p className={styles.chartSubtitle}>{currentMonthName} 2026 spending by category</p>
              </div>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Previous Month Category Breakdown Chart */}
        {previousMonthData.length > 0 && (
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.headerTitleSection}>
                <FaChartPie className={styles.headerIcon} />
                <div>
                  <h3>Last Month's Breakdown</h3>
                  <p className={styles.chartSubtitle}>{previousMonthName} 2026 spending by category</p>
                </div>
              </div>
            </div>
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={previousMonthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {previousMonthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rs ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Monthly Trend Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div className={styles.headerTitleSection}>
              <FaChartLine className={styles.headerIcon} />
              <div>
                <h3>Monthly Comparison</h3>
                <p className={styles.chartSubtitle}>Total spending by month (all time)</p>
              </div>
            </div>
          </div>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `Rs ${value}`} />
                <Tooltip 
                  cursor={{fill: 'rgba(0, 0, 0, 0.05)'}} 
                  formatter={(value) => [`Rs ${value.toLocaleString()}`, 'Expenses']} 
                />
                <Bar dataKey="amount" fill="#ff7300" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingPatterns;
