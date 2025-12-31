import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import styles from './Dashboard.module.css';
import Sidebar from './Sidebar';
import StatCard from './StatCard';

const Dashboard = () => {
  const [userName, setUserName] = useState('');
  const [totals, setTotals] = useState({ totalBalance: 0, totalIncome: 0, totalExpenses: 0, totalSavings: 0 });
  const [spendingData, setSpendingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const currency = 'Rs';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    setUserName(user.name);

    const userId = user.userID;

    // Fetch totals
    fetch(`https://localhost:7167/api/dashboard/totals/${userId}`)
      .then(res => res.json())
      .then(data => setTotals({
        totalBalance: data.totalBalance,
        totalIncome: data.totalIncome,
        totalExpenses: data.totalExpenses,
        totalSavings: data.totalSavings
      }))
      .catch(err => console.error("Failed to fetch totals:", err));

    // Fetch monthly spending
    fetch(`https://localhost:7167/api/dashboard/spending/${userId}`)
      .then(res => res.json())
      .then(data => setSpendingData(data))
      .catch(err => console.error("Failed to fetch spending:", err));

    // Fetch category breakdown
    fetch(`https://localhost:7167/api/dashboard/categories/${userId}`)
      .then(res => res.json())
      .then(data => setCategoryData(data))
      .catch(err => console.error("Failed to fetch categories:", err));

    // Fetch recent transactions
    fetch(`https://localhost:7167/api/expenses/recent/${userId}`)
      .then(res => res.json())
      .then(data => setRecentTransactions(data))
      .catch(err => console.error("Failed to fetch recent transactions:", err));

  }, []);

  const statData = [
    { title: 'Total Balance', amount: `${currency} ${totals.totalBalance}`, color: '#f06292', icon: '💰' },
    { title: 'Total Income', amount: `${currency} ${totals.totalIncome}`, color: '#81c784', icon: '💸' },
    { title: 'Total Expenses', amount: `${currency} ${totals.totalExpenses}`, color: '#ff7043', icon: '💳' },
    { title: 'Total Savings', amount: `${currency} ${totals.totalSavings}`, color: '#5c6bc0', icon: '🏦' },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.mainHeader}>
          <h2>Welcome Back, {userName || 'User'}</h2>
          <p className={styles.subHeader}>Here's what's happening with your money today</p>
        </header>

        {/* Stat Cards */}
        <section className={styles.statCardsRow}>
          {statData.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              amount={stat.amount}
              iconColor={stat.color}
              icon={stat.icon}
            />
          ))}
        </section>

        {/* Charts */}
        <section className={styles.chartArea}>
          <div className={styles.lineChartContainer}>
            <h3>Income vs Expenses (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={spendingData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="Income" stroke="#81c784" />
                <Line type="monotone" dataKey="Expense" stroke="#ff7043" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.pieChartContainer}>
            <h3>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className={styles.recentTransactions}>
          <h3>Recent Transactions</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount ({currency})</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map(tx => (
                <tr key={tx.id}>
                  <td>{tx.date}</td>
                  <td>{tx.description}</td>
                  <td>{tx.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
