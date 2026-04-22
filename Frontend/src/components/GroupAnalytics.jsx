import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { FaSpinner } from 'react-icons/fa';
import * as groupExpenseService from '../services/groupExpenseService';
import './GroupAnalytics.css';

const GroupAnalytics = ({ groupId, groupMembers = [] }) => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Colors for pie charts
  const COLORS_MEMBERS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30b0c8'];
  const COLORS_CATEGORY = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#ff9800', '#e91e63', '#9c27b0'];

  useEffect(() => {
    if (groupId) {
      fetchExpenses();
    }
  }, [groupId]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await groupExpenseService.getGroupExpenses(groupId);
      setExpenses(data || []);
    } catch (err) {
      console.error('Failed to fetch expenses for analytics:', err);
      setError('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate member spending (who spent how much) - includes ALL members
  const getMemberSpendingData = () => {
    const memberMap = {};

    // First, initialize all group members with 0 spending
    if (groupMembers && groupMembers.length > 0) {
      groupMembers.forEach(member => {
        memberMap[member.userId] = {
          userId: member.userId,
          amount: 0,
          name: member.name || `User ${member.userId}`
        };
      });
    }

    // Calculate each member's actual spending from their share in splits
    if (expenses.length > 0) {
      expenses.forEach(expense => {
        // Sum up all splits for this expense (amount each person owes/spent)
        if (expense.splits && expense.splits.length > 0) {
          expense.splits.forEach(split => {
            const memberId = split.userOwesId;
            
            if (!memberMap[memberId]) {
              memberMap[memberId] = {
                userId: memberId,
                amount: 0,
                name: split.userOwes || `User ${memberId}`
              };
            }
            
            // Add the split amount (their actual spending)
            memberMap[memberId].amount += split.amount;
          });
        }
      });
    }

    // Convert to array and format for pie chart, keeping userId
    return Object.values(memberMap)
      .map(item => ({
        userId: item.userId,
        name: item.name,
        value: parseFloat(item.amount.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Calculate category breakdown
  const getCategoryBreakdownData = () => {
    if (expenses.length === 0) return [];

    const categoryMap = {};

    expenses.forEach(expense => {
      const category = expense.category || 'Uncategorized';
      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += expense.amount;
    });

    // Convert to array and format for pie chart
    return Object.entries(categoryMap)
      .map(([category, amount]) => ({
        name: category,
        value: parseFloat(amount.toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Custom label for pie charts
  const renderCustomLabel = ({ name, value }) => {
    return `${name}`;
  };

  // Custom tooltip
  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="tooltip-name">{payload[0].name}</p>
          <p className="tooltip-value">Rs {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const memberData = getMemberSpendingData();
  const categoryData = getCategoryBreakdownData();
  const totalSpending = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (loading) {
    return (
      <div className="analytics-loading">
        <FaSpinner className="spinner" />
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>{error}</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="analytics-empty">
        <p>No expenses yet. Start adding expenses to see analytics.</p>
      </div>
    );
  }

  return (
    <div className="group-analytics-container">
      {/* Overall Summary */}
      <div className="analytics-summary">
        <h3>Total Group Spending</h3>
        <p className="total-amount">Rs {totalSpending.toLocaleString()}</p>
        <p className="summary-text">{expenses.length} transactions across {memberData.length} members and {categoryData.length} categories</p>
      </div>

      {/* Member Spending Chart */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>Spending by Member</h3>
          <p className="section-subtitle">Who spent how much in the group</p>
        </div>
        <div className="chart-container">
          {memberData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={memberData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {memberData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_MEMBERS[index % COLORS_MEMBERS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={renderCustomTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              {/* Member breakdown table */}
              <div className="breakdown-table">
                <div className="table-header">
                  <span className="col-name">Member</span>
                  <span className="col-amount">Amount</span>
                  <span className="col-percentage">Percentage</span>
                </div>
                {memberData.map((member, idx) => (
                  <div key={idx} className="table-row">
                    <span className="col-name">
                      <span className="color-dot" style={{ backgroundColor: COLORS_MEMBERS[idx % COLORS_MEMBERS.length] }}></span>
                      {member.name}
                    </span>
                    <span className="col-amount">Rs {member.value.toLocaleString()}</span>
                    <span className="col-percentage">{((member.value / totalSpending) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>No member data available</p>
          )}
        </div>
      </div>

      {/* Category Breakdown Chart */}
      <div className="analytics-section">
        <div className="section-header">
          <h3>Spending by Category</h3>
          <p className="section-subtitle">Expense breakdown by category</p>
        </div>
        <div className="chart-container">
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_CATEGORY[index % COLORS_CATEGORY.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={renderCustomTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              {/* Category breakdown table */}
              <div className="breakdown-table">
                <div className="table-header">
                  <span className="col-name">Category</span>
                  <span className="col-amount">Amount</span>
                  <span className="col-percentage">Percentage</span>
                </div>
                {categoryData.map((category, idx) => (
                  <div key={idx} className="table-row">
                    <span className="col-name">
                      <span className="color-dot" style={{ backgroundColor: COLORS_CATEGORY[idx % COLORS_CATEGORY.length] }}></span>
                      {category.name}
                    </span>
                    <span className="col-amount">Rs {category.value.toLocaleString()}</span>
                    <span className="col-percentage">{((category.value / totalSpending) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>No category data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupAnalytics;
