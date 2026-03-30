import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './Dashboard.module.css';
import Sidebar from './Sidebar';
import CategorySection from "./CategorySection";
import { FaArrowUp, FaArrowDown, FaPiggyBank, FaEye, FaEyeSlash, FaPlus, FaCalendarAlt, FaClock } from 'react-icons/fa';
import incomeService from '../../services/incomeService';

const Dashboard = () => {
  const [userName, setUserName] = useState('');
  const [totals, setTotals] = useState({ totalBalance: 0, totalIncome: 0, totalExpenses: 0, totalSavings: 0 });
  const [spendingData, setSpendingData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [showBalance, setShowBalance] = useState(true);
  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('Salary');
  const [addingIncome, setAddingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState('');
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);
  const currency = 'Rs';
  const userId = JSON.parse(localStorage.getItem("user"))?.userID || 1;

  // Calculate days left in month
  const getDaysLeftInMonth = () => {
    const today = new Date();
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysLeft = lastDay.getDate() - today.getDate();
    return daysLeft;
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    const user = JSON.parse(storedUser);
    setUserName(user.name);

    // Fetch totals (for current month - always show current balance)
    fetch(`http://localhost:5262/api/dashboard/totals/${userId}`)
      .then(res => res.json())
      .then(data => {
        console.log("Dashboard - Fetched totals:", data);
        setTotals(data);
      })
      .catch(err => console.error("Failed to fetch totals:", err));

    // Fetch monthly spending (all months for year view)
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

    // Fetch category breakdown
    fetch(`http://localhost:5262/api/dashboard/categories/${userId}`)
      .then(res => res.json())
      .then(data => setCategoryData(data))
      .catch(err => console.error("Failed to fetch categories:", err));

    // Fetch recent transactions
    fetch(`http://localhost:5262/api/expenses/recent/${userId}`)
      .then(res => res.json())
      .then(data => setRecentTransactions(data))
      .catch(err => console.error("Failed to fetch recent transactions:", err));
  }, [userId]);

  // Refresh totals after adding income
  const refreshTotals = async () => {
    try {
      const response = await fetch(`http://localhost:5262/api/dashboard/totals/${userId}`);
      const data = await response.json();
      setTotals(data);
    } catch (err) {
      console.error("Failed to refresh totals:", err);
    }
  };

  // Refresh recent transactions after adding expense
  const refreshTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5262/api/expenses/recent/${userId}`);
      const data = await response.json();
      setRecentTransactions(data);
      console.log("Transactions refreshed after expense added");
    } catch (err) {
      console.error("Failed to refresh transactions:", err);
    }
  };

  // Handle adding income
  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeAmount || incomeAmount <= 0) {
      setIncomeError('Please enter a valid amount');
      return;
    }

    try {
      setAddingIncome(true);
      setIncomeError('');
      
      await incomeService.addIncome(userId, parseFloat(incomeAmount), incomeSource);
      
      // Refresh totals to show updated balance and income
      await refreshTotals();
      
      // Reset form
      setIncomeAmount('');
      setIncomeSource('Salary');
      setShowAddIncomeForm(false);
    } catch (err) {
      console.error('Failed to add income:', err);
      setIncomeError('Failed to add income');
    } finally {
      setAddingIncome(false);
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      <Sidebar />

      <main className={styles.mainContent}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div>
              <h1>Welcome back, <span className={styles.userName}>{userName || 'User'}</span></h1>
              <p className={styles.heroSubtitle}>Here's your financial overview</p>
              <div className={styles.heroMetaCards}>
                <div className={styles.metaCard}>
                  <div className={styles.metaCardIcon} style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                    <FaCalendarAlt />
                  </div>
                  <div className={styles.metaCardContent}>
                    <p className={styles.metaCardLabel}>Today</p>
                    <p className={styles.metaCardValue}>
                      {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </p>
                    <p className={styles.metaCardSubtext}>
                      {new Date().toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className={styles.metaCard}>
                  <div className={styles.metaCardIcon} style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'}}>
                    <FaClock />
                  </div>
                  <div className={styles.metaCardContent}>
                    <p className={styles.metaCardLabel}>Time Left</p>
                    <p className={styles.metaCardValue}>{getDaysLeftInMonth()}</p>
                    <p className={styles.metaCardSubtext}>days till month end</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.balanceCardWrapper}>
              <div className={styles.balanceCard}>
                <div className={styles.balanceHeader}>
                  <span className={styles.balanceLabel}>Total Balance</span>
                  <button 
                    className={styles.eyeToggle}
                    onClick={() => setShowBalance(!showBalance)}
                    title={showBalance ? "Hide balance" : "Show balance"}
                  >
                    {showBalance ? <FaEye /> : <FaEyeSlash />}
                  </button>
                </div>
                <h2 className={styles.balanceAmount}>
                  {showBalance ? `${currency} ${totals.totalBalance?.toLocaleString()}` : '••••••'}
                </h2>
                <p className={styles.balanceNote}>Your current balance</p>
                <button 
                  className={styles.addIncomeBtn} 
                  onClick={() => setShowAddIncomeForm(!showAddIncomeForm)}
                >
                  <FaPlus /> Add Income
                </button>
              </div>
              
              {/* Add Income Form */}
              {showAddIncomeForm && (
                <div className={styles.addIncomeForm}>
                  <h3>Add Income</h3>
                  {incomeError && <p className={styles.errorMsg}>{incomeError}</p>}
                  <form onSubmit={handleAddIncome}>
                    <div className={styles.formGroup}>
                      <label>Amount ({currency})</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={incomeAmount}
                        onChange={(e) => setIncomeAmount(e.target.value)}
                        disabled={addingIncome}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Source</label>
                      <select 
                        value={incomeSource} 
                        onChange={(e) => setIncomeSource(e.target.value)}
                        disabled={addingIncome}
                      >
                        <option value="Salary">Salary</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Investment">Investment</option>
                        <option value="Bonus">Bonus</option>
                        <option value="Gift">Gift</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className={styles.formActions}>
                      <button type="submit" className={styles.submitBtn} disabled={addingIncome}>
                        {addingIncome ? 'Adding...' : 'Add Income'}
                      </button>
                      <button 
                        type="button" 
                        className={styles.cancelBtn}
                        onClick={() => setShowAddIncomeForm(false)}
                        disabled={addingIncome}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statIconIncome}>
              <FaArrowDown />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Income</p>
              <h3 className={styles.statValue}>{currency} {totals.totalIncome?.toLocaleString()}</h3>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIconExpense}>
              <FaArrowUp />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Expenses</p>
              <h3 className={styles.statValue}>{currency} {totals.totalExpenses?.toLocaleString()}</h3>
            </div>
          </div>

          <div className={styles.statItem}>
            <div className={styles.statIconSavings}>
              <FaPiggyBank />
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Savings</p>
              <h3 className={styles.statValue}>{currency} {totals.totalSavings?.toLocaleString()}</h3>
            </div>
          </div>
        </section>

        {/* Charts Section */}
        <section className={styles.chartsSection}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Income vs Expenses</h3>
              <p className={styles.chartSubtitle}>Last 12 months</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={spendingData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#43e97b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#43e97b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fa709a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#fa709a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#ccc" style={{ fontSize: '12px' }} />
                <YAxis stroke="#ccc" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px'
                  }}
                />
                <Area type="monotone" dataKey="Income" stroke="#43e97b" fillOpacity={1} fill="url(#incomeGradient)" />
                <Area type="monotone" dataKey="Expense" stroke="#fa709a" fillOpacity={1} fill="url(#expenseGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Category Breakdown</h3>
              <p className={styles.chartSubtitle}>Spending by category</p>
            </div>
            <CategorySection userId={userId} totalBalance={totals.totalBalance} categoryData={categoryData} onExpenseAdded={refreshTransactions} />
          </div>
        </section>

        {/* Recent Transactions */}
        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h3>Recent Transactions</h3>
            <button 
              className={styles.viewAll} 
              onClick={() => setShowAllTransactionsModal(true)}
            >
              View all →
            </button>
          </div>
          <div className={styles.transactionList}>
            {recentTransactions?.slice(0, 3).map((tx, idx) => (
              <div key={idx} className={styles.transactionItem}>
                <div className={styles.txInfo}>
                  <p className={styles.txCategory}>{tx.description}</p>
                  <p className={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</p>
                </div>
                <span className={`${styles.txAmount} ${tx.amount < 0 ? styles.expense : styles.income}`}>
                  {tx.amount < 0 ? '-' : '+'} {currency} {Math.abs(tx.amount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* All Transactions Modal */}
        {showAllTransactionsModal && (
          <div className={styles.modalOverlay} onClick={() => setShowAllTransactionsModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>All Transactions</h2>
                <button 
                  className={styles.modalClose}
                  onClick={() => setShowAllTransactionsModal(false)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.modalBody}>
                {recentTransactions && recentTransactions.length > 0 ? (
                  <div className={styles.allTransactionsList}>
                    {recentTransactions.map((tx, idx) => (
                      <div key={idx} className={styles.transactionItemModal}>
                        <div className={styles.txInfoModal}>
                          <p className={styles.txCategoryModal}>{tx.description}</p>
                          <p className={styles.txDateModal}>{new Date(tx.date).toLocaleDateString('en-IN', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</p>
                        </div>
                        <span className={`${styles.txAmountModal} ${tx.amount < 0 ? styles.expenseModal : styles.incomeModal}`}>
                          {tx.amount < 0 ? '-' : '+'} {currency} {Math.abs(tx.amount).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No transactions found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;



