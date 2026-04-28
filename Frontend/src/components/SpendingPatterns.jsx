import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { FaChartPie, FaRegLightbulb } from 'react-icons/fa';
import styles from './SpendingPatterns.module.css';
import expenseService from '../services/expenseService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658', '#ff7300', '#d0ed57'];

const SpendingPatterns = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topCategory, setTopCategory] = useState(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        setLoading(true);
        const data = await expenseService.getUserExpenses(userId);
        
        if (!data || data.length === 0) {
          setExpenses([]);
          setLoading(false);
          return;
        }

        // Process data for Category Pie Chart
        const catMap = {};
        data.forEach(exp => {
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

        // Process data for Monthly Bar Chart
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthMap = {};

        data.forEach(exp => {
          const date = new Date(exp.dateAdded);
          const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          const sortKey = date.getFullYear() * 100 + date.getMonth(); // For sorting

          if (!monthMap[monthKey]) {
            monthMap[monthKey] = { month: monthKey, sortKey, amount: 0 };
          }
          monthMap[monthKey].amount += exp.amount;
        });

        const mData = Object.values(monthMap)
          .sort((a, b) => a.sortKey - b.sortKey)
          .map(({ month, amount }) => ({ month, amount })); // Remove sortKey

        setMonthlyData(mData);
        setExpenses(data);
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
      {/* AI Insights Summary */}
      <div className={styles.insightsSection}>
        {topCategory && (
          <div className={styles.insightCard}>
            <div className={styles.insightIcon}>
              <FaRegLightbulb />
            </div>
            <div className={styles.insightContent}>
              <h3>Smart Analysis</h3>
              <p>Your highest spending category historically is <strong>{topCategory.name}</strong>, accounting for <strong>Rs {topCategory.value.toLocaleString()}</strong>.</p>
            </div>
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className={styles.chartsGrid}>
        {/* Category Breakdown Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Expenses by Category</h3>
            <p className={styles.chartSubtitle}>Historical breakdown of your spending</p>
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

        {/* Monthly Trend Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3>Spending Trends</h3>
            <p className={styles.chartSubtitle}>Your total expenses over time</p>
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
