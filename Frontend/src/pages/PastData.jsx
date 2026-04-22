import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './PastData.module.css';
import Sidebar from '../components/dashboard/Sidebar';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

const PastData = () => {
  const [spendingData, setSpendingData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(null); // Start with no month selected
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const currency = 'Rs';
  const userId = JSON.parse(localStorage.getItem("user"))?.userID || 1;

  // Get available months from spending data (excluding current month)
  const getAvailableMonths = () => {
    if (spendingData.length === 0) return [];
    
    const today = new Date();
    const currentMonthIndex = today.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    // Map all spending data and get their month index
    const monthsWithData = spendingData.map((data) => {
      const monthIndex = monthNames.indexOf(data.month);
      return { 
        month: data.month, 
        monthIndex: monthIndex,
        data: data 
      };
    });
    
    // Filter to only include PAST months (index < current month)
    const pastMonths = monthsWithData.filter(item => item.monthIndex < currentMonthIndex);
    
    // Sort by most recent first
    pastMonths.sort((a, b) => b.monthIndex - a.monthIndex);
    
    return pastMonths;
  };

  // Get formatted month label for display
  const getMonthLabel = (monthName) => {
    return `${monthName} 2026`;
  };

  // Filter transactions by selected month
  const getFilteredTransactions = () => {
    if (!selectedMonth) return [];
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(selectedMonth);
    const currentYear = new Date().getFullYear();
    
    const filtered = recentTransactions.filter(transaction => {
      // Use date property (or dateAdded as fallback)
      const dateString = transaction.date || transaction.dateAdded;
      const txDate = new Date(dateString);
      const sameMonth = txDate.getMonth() === monthIndex;
      const sameYear = txDate.getFullYear() === currentYear;
      return sameMonth && sameYear;
    });
    
    console.log(`Filtered transactions for ${selectedMonth}:`, filtered);
    return filtered;
  };

  // Get selected month spending data
  const getSelectedMonthData = () => {
    if (!selectedMonth) return { Income: 0, Expense: 0 };
    
    const monthData = spendingData.find(d => d.month === selectedMonth);
    return monthData ? { Income: monthData.Income, Expense: monthData.Expense } : { Income: 0, Expense: 0 };
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    // Fetch all data including both expenses AND income
    Promise.all([
      fetch(`http://localhost:5262/api/dashboard/spending/${userId}`).then(r => r.json()).catch(e => { console.error("Spending API failed:", e); return []; }),
      fetch(`http://localhost:5262/api/expenses/${userId}`).then(r => r.json()).catch(e => { console.error("Expenses API failed:", e); return []; }),
      fetch(`http://localhost:5262/api/income/${userId}`).then(r => r.json()).catch(e => { console.error("Income API failed:", e); return []; })
    ])
      .then(([spendingRes, expensesRes, incomeRes]) => {
        console.log("Raw Spending Data:", spendingRes);
        console.log("Raw Expenses Data:", expensesRes);
        console.log("Raw Income Data:", incomeRes);
        
        // Month name mapping
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Format spending data
        const formattedSpending = Array.isArray(spendingRes) 
          ? spendingRes.map(d => {
              let monthName = d.month;
              if (typeof d.month === 'number') {
                const monthIndex = d.month > 12 ? d.month : (d.month >= 1 ? d.month - 1 : d.month);
                monthName = monthNames[monthIndex];
              }
              return {
                month: monthName,
                Income: d.income ?? d.Income ?? 0,
                Expense: d.expense ?? d.Expense ?? 0
              };
            })
          : [];
        
        // Combine expenses and income into single transactions array
        const expensesArray = Array.isArray(expensesRes) ? expensesRes : [];
        const incomeArray = Array.isArray(incomeRes) ? incomeRes : [];
        
        // Format expenses
        const formattedExpenses = expensesArray.map(e => ({
          id: e.id,
          date: e.dateAdded,
          dateAdded: e.dateAdded,
          description: e.category,
          amount: -Math.abs(e.amount), // Negative for expenses
          type: 'expense'
        }));
        
        // Format income
        const formattedIncome = incomeArray.map(i => ({
          id: i.id,
          date: i.dateAdded,
          dateAdded: i.dateAdded,
          description: i.source || 'Income',
          amount: Math.abs(i.amount), // Positive for income
          type: 'income'
        }));
        
        // Combine and sort by date (newest first)
        const allTransactions = [...formattedExpenses, ...formattedIncome]
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log("Formatted Spending Data:", formattedSpending);
        console.log("All Transactions Combined:", allTransactions);
        
        setSpendingData(formattedSpending);
        setRecentTransactions(allTransactions);
        setIsDataLoaded(true);
      })
      .catch(err => {
        console.error("Failed to fetch past data:", err);
        setIsDataLoaded(true);
      });
  }, [userId]);

  const availableMonths = getAvailableMonths();
  const filteredTransactions = getFilteredTransactions();
  const selectedMonthData = getSelectedMonthData();

  return (
    <div className={styles.pastDataLayout}>
      <Sidebar />
      
      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div>
              <h1>Past Data</h1>
              <p className={styles.heroSubtitle}>View your financial history</p>
            </div>
          </div>
        </section>

        {/* Month Selection */}
        <section className={styles.monthSelectionSection}>
          <h3>Select a Month</h3>
          {availableMonths.length > 0 ? (
            <div className={styles.monthGrid}>
              {availableMonths.map((monthItem, idx) => (
                <button
                  key={idx}
                  className={`${styles.monthButton} ${selectedMonth === monthItem.month ? styles.active : ''}`}
                  onClick={() => setSelectedMonth(monthItem.month)}
                >
                  <p className={styles.monthName}>{monthItem.month}</p>
                  <p className={styles.monthStats}>
                    <span className={styles.income}>+{currency} {(monthItem.data.Income || 0)?.toLocaleString()}</span>
                    <span className={styles.expense}>-{currency} {(monthItem.data.Expense || 0)?.toLocaleString()}</span>
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No past Data found</p>
            </div>
          )}
        </section>

        {/* Selected Month Data */}
        {selectedMonth && availableMonths.length > 0 ? (
          <>
            {/* Summary Card */}
            <section className={styles.summarySection}>
              <h2>{getMonthLabel(selectedMonth)}</h2>
              <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon} style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'}}>
                    <FaArrowUp />
                  </div>
                  <div className={styles.summaryContent}>
                    <p className={styles.summaryLabel}>Total Income</p>
                    <h3 className={styles.summaryValue}>{currency} {selectedMonthData.Income?.toLocaleString()}</h3>
                  </div>
                </div>

                <div className={styles.summaryCard}>
                  <div className={styles.summaryIcon} style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'}}>
                    <FaArrowDown />
                  </div>
                  <div className={styles.summaryContent}>
                    <p className={styles.summaryLabel}>Total Expenses</p>
                    <h3 className={styles.summaryValue}>{currency} {selectedMonthData.Expense?.toLocaleString()}</h3>
                  </div>
                </div>
              </div>
            </section>

            {/* Chart */}
            <section className={styles.chartSection}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <h3>Monthly Comparison</h3>
                  <p className={styles.chartSubtitle}>Income vs Expenses across all months</p>
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
            </section>

            {/* Transactions */}
            <section className={styles.transactionsSection}>
              <h3>Transactions in {getMonthLabel(selectedMonth)}</h3>
              {filteredTransactions && filteredTransactions.length > 0 ? (
                <div className={styles.transactionList}>
                  {filteredTransactions.map((tx, idx) => (
                    <div key={idx} className={styles.transactionItem}>
                      <div className={styles.txInfo}>
                        <p className={styles.txCategory}>{tx.description}</p>
                        <p className={styles.txDate}>{new Date(tx.date || tx.dateAdded).toLocaleDateString('en-IN', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                      <span className={`${styles.txAmount} ${tx.amount < 0 ? styles.expense : styles.income}`}>
                        {tx.amount < 0 ? '-' : '+'} {currency} {Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noTransactions}>
                  <p>No transactions found for {getMonthLabel(selectedMonth)}</p>
                </div>
              )}
            </section>
          </>
        ) : (
          !isDataLoaded ? (
            <div className={styles.loadingSection}>
              <p>Loading...</p>
            </div>
          ) : availableMonths.length === 0 && (
            <div className={styles.emptyStateSection}>
              <p>No past Data found</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default PastData;
