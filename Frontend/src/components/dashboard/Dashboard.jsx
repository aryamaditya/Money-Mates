// import React, { useEffect, useState } from 'react';
// import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
// import styles from './Dashboard.module.css';
// import Sidebar from './Sidebar';
// import StatCard from './StatCard';
// import CategorySection from "./CategorySection";

// const Dashboard = () => {
//   const [userName, setUserName] = useState('');
//   const [totals, setTotals] = useState({ totalBalance: 0, totalIncome: 0, totalExpenses: 0, totalSavings: 0 });
//   const [spendingData, setSpendingData] = useState([]);
//   const [categoryData, setCategoryData] = useState([]);
//   const [recentTransactions, setRecentTransactions] = useState([]);
//   const currency = 'Rs';

//   useEffect(() => {
//     const storedUser = localStorage.getItem('user');
//     if (!storedUser) return;

//     const user = JSON.parse(storedUser);
//     setUserName(user.name);

//     const userId = user.userID;

//     // Fetch totals
//     fetch(`https://localhost:7167/api/dashboard/totals/${userId}`)
//       .then(res => res.json())
//       .then(data => setTotals({
//         totalBalance: data.totalBalance,
//         totalIncome: data.totalIncome,
//         totalExpenses: data.totalExpenses,
//         totalSavings: data.totalSavings
//       }))
//       .catch(err => console.error("Failed to fetch totals:", err));

//     // Fetch monthly spending
//     fetch(`https://localhost:7167/api/dashboard/spending/${userId}`)
//       .then(res => res.json())
//       .then(data => setSpendingData(data))
//       .catch(err => console.error("Failed to fetch spending:", err));

//     // Fetch category breakdown
//     fetch(`https://localhost:7167/api/dashboard/categories/${userId}`)
//       .then(res => res.json())
//       .then(data => setCategoryData(data))
//       .catch(err => console.error("Failed to fetch categories:", err));

//     // Fetch recent transactions
//     fetch(`https://localhost:7167/api/expenses/recent/${userId}`)
//       .then(res => res.json())
//       .then(data => setRecentTransactions(data))
//       .catch(err => console.error("Failed to fetch recent transactions:", err));

//   }, []);

//   const statData = [
//     { title: 'Total Balance', amount: `${currency} ${totals.totalBalance}`, color: '#f06292', icon: '💰' },
//     { title: 'Total Income', amount: `${currency} ${totals.totalIncome}`, color: '#81c784', icon: '💸' },
//     { title: 'Total Expenses', amount: `${currency} ${totals.totalExpenses}`, color: '#ff7043', icon: '💳' },
//     { title: 'Total Savings', amount: `${currency} ${totals.totalSavings}`, color: '#5c6bc0', icon: '🏦' },
//   ];

//   const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

//   return (
//     <div className={styles.dashboardLayout}>
//       <Sidebar />

//       <main className={styles.mainContent}>
//         <header className={styles.mainHeader}>
//           <h2>Welcome Back, {userName || 'User'}</h2>
//           <p className={styles.subHeader}>Here's what's happening with your money today</p>
//         </header>

//         {/* Stat Cards */}
//         <section className={styles.statCardsRow}>
//           {statData.map((stat, index) => (
//             <StatCard
//               key={index}
//               title={stat.title}
//               amount={stat.amount}
//               iconColor={stat.color}
//               icon={stat.icon}
//             />
//           ))}
//         </section>

//         {/* Charts */}
//         <section className={styles.chartArea}>
//           <div className={styles.lineChartContainer}>
//             <h3>Income vs Expenses (Monthly)</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <LineChart data={spendingData}>
//                 <XAxis dataKey="month" />
//                 <YAxis />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="Income" stroke="#81c784" />
//                 <Line type="monotone" dataKey="Expense" stroke="#ff7043" />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>

//           <div className={styles.pieChartContainer}>
//             <h3>Spending by Category</h3>
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={categoryData}
//                   dataKey="value"
//                   nameKey="name"
//                   cx="50%"
//                   cy="50%"
//                   outerRadius={100}
//                   fill="#8884d8"
//                   label
//                 >
//                   {categoryData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                   ))}
//                 </Pie>
//                 <Legend />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </section>

//         {/* Recent Transactions */}
//         <section className={styles.recentTransactions}>
//           <h3>Recent Transactions</h3>
//           <table>
//             <thead>
//               <tr>
//                 <th>Date</th>
//                 <th>Description</th>
//                 <th>Amount ({currency})</th>
//               </tr>
//             </thead>
//             <tbody>
//               {recentTransactions.map(tx => (
//                 <tr key={tx.id}>
//                   <td>{tx.date}</td>
//                   <td>{tx.description}</td>
//                   <td>{tx.amount}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </section>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import styles from './Dashboard.module.css';
import './RecentTransactions.css';
import Sidebar from './Sidebar';
import StatCard from './StatCard';
import CategorySection from "./CategorySection";

const Dashboard = () => {
  const [userName, setUserName] = useState('');
  const [totals, setTotals] = useState({ totalBalance: 0, totalIncome: 0, totalExpenses: 0, totalSavings: 0 });
  const [spendingData, setSpendingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const currency = 'Rs';
  const userId = JSON.parse(localStorage.getItem("user"))?.userID || 1;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BFE', '#FF6384', '#36A2EB'];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    setUserName(user.name);

    // Fetch totals
    fetch(`http://localhost:5262/api/dashboard/totals/${userId}`)
      .then(res => res.json())
      .then(data => setTotals(data))
      .catch(err => console.error("Failed to fetch totals:", err));

    // Fetch monthly spending and ensure keys match Recharts
    fetch(`http://localhost:5262/api/dashboard/spending/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        const formattedData = data.map(d => ({
          month: d.month,
          Income: d.income ?? d.Income ?? 0,
          Expense: d.expense ?? d.Expense ?? 0
        }));
        setSpendingData(formattedData);
      })
      .catch(err => console.error("Failed to fetch spending:", err));

    // Fetch category breakdown for PieChart
    fetch(`http://localhost:5262/api/dashboard/categories/${userId}`)
      .then(res => res.json())
      .then(data => {
        const formattedCategoryData = data.map(d => ({
          name: d.category ?? d.name,
          value: d.used ?? d.value ?? 0
        }));
        setCategoryData(formattedCategoryData);
      })
      .catch(err => console.error("Failed to fetch categories:", err));

    // Fetch recent transactions
    fetch(`http://localhost:5262/api/expenses/recent/${userId}`)
      .then(res => res.json())
      .then(data => setRecentTransactions(data))
      .catch(err => console.error("Failed to fetch recent transactions:", err));
  }, [userId]);

  const statData = [
    { title: 'Total Balance', amount: `${currency} ${totals.totalBalance}`, color: '#f06292', icon: '💰' },
    { title: 'Total Income', amount: `${currency} ${totals.totalIncome}`, color: '#81c784', icon: '💸' },
    { title: 'Total Expenses', amount: `${currency} ${totals.totalExpenses}`, color: '#ff7043', icon: '💳' },
    { title: 'Total Savings', amount: `${currency} ${totals.totalSavings}`, color: '#5c6bc0', icon: '🏦' },
  ];

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
            <StatCard key={index} {...stat} />
          ))}
        </section>

        {/* Charts */}
        <section className={styles.chartArea}>
          {/* Income vs Expenses LineChart */}
          <div className={styles.lineChartContainer}>
            <h3>Income vs Expenses (Monthly)</h3>
            <ResponsiveContainer width="100%" height={300}>
              {spendingData.length > 0 ? (
                <LineChart data={spendingData}>
                  <XAxis dataKey="month" tickFormatter={m => `Month ${m}`} />
                  <YAxis />
                  <Tooltip formatter={value => `${currency} ${value}`} />
                  <Line type="monotone" dataKey="Income" stroke="#81c784" strokeWidth={2} />
                  <Line type="monotone" dataKey="Expense" stroke="#ff7043" strokeWidth={2} />
                </LineChart>
              ) : (
                <p>Loading chart...</p>
              )}
            </ResponsiveContainer>
          </div>

          {/* Spending by Category PieChart */}
          <div className={styles.pieChartContainer}>
            <h3>Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              {categoryData.length > 0 ? (
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={entry => `${entry.name}: ${entry.value}`}
                    isAnimationActive={true}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={value => `${currency} ${value}`} />
                </PieChart>
              ) : (
                <p>Loading chart...</p>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category Section */}
        <CategorySection userId={userId} totalBalance={totals.totalBalance} />

        {/* Recent Transactions */}
        <section className="recent-transactions-section">
          <div className="transaction-header">
            <h3 className="transaction-title">💳 Recent Transactions</h3>
            <p className="transaction-subtitle">Your latest expense activity</p>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="transactions-list">
              {recentTransactions.map((tx, index) => (
                <div key={tx.id || index} className="transaction-item">
                  <div className="transaction-icon">💰</div>
                  <div className="transaction-info">
                    <p className="transaction-description">{tx.description || tx.category || 'Expense'}</p>
                    <p className="transaction-date">{new Date(tx.dateAdded).toLocaleDateString('en-IN', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</p>
                  </div>
                  <div className="transaction-amount">
                    <span className="amount">-Rs {tx.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;



