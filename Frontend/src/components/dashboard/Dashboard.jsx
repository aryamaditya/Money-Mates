import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import styles from './Dashboard.module.css';
import Sidebar from './Sidebar';
import StatCard from './StatCard';

const Dashboard = () => {
  const [userName, setUserName] = useState('');
  const currency = 'Rs';

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name); 
    }
  }, []);

  const statData = [
    { title: 'Total Balance', amount: `${currency} -`, color: '#f06292', icon: '💰' },
    { title: 'Total Income', amount: `${currency} -`, color: '#81c784', icon: '💸' },
    { title: 'Total Expenses', amount: `${currency} -`, color: '#ff7043', icon: '💳' },
    { title: 'Total Savings', amount: `${currency} -`, color: '#5c6bc0', icon: '🏦' },
  ];

  const spendingData = [
    { month: 'Jan', Income: 40000, Expense: 25000 },
    { month: 'Feb', Income: 35000, Expense: 30000 },
    { month: 'Mar', Income: 45000, Expense: 20000 },
    { month: 'Apr', Income: 50000, Expense: 35000 },
    { month: 'May', Income: 40000, Expense: 30000 },
  ];

  const categoryData = [
    { name: 'Food', value: 400 },
    { name: 'Transport', value: 300 },
    { name: 'Entertainment', value: 200 },
    { name: 'Others', value: 100 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const recentTransactions = [
    { id: 1, description: 'Grocery', amount: 5000, date: '2025-11-20' },
    { id: 2, description: 'Movie', amount: 1200, date: '2025-11-19' },
    { id: 3, description: 'Bus Ticket', amount: 350, date: '2025-11-18' },
    { id: 4, description: 'Online Shopping', amount: 8000, date: '2025-11-17' },
  ];

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.mainHeader}>
          <h2>Welcome Back, {userName || 'User'}</h2>
          <p className={styles.subHeader}>Here's what's happening with your money today</p>
        </header>

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

        <section className={styles.chartArea}>
          {/* ...rest of your charts and bottom row unchanged */}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
