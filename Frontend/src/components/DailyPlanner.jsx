import React, { useState, useEffect } from 'react';
import { FaPlus, FaHistory } from 'react-icons/fa';
import { dailyPlannerService } from '../services/dailyPlannerService';
import './DailyPlanner.css';

const DailyPlanner = ({ userId }) => {
  const [dailyPlan, setDailyPlan] = useState(null);
  const [categoryAllocation, setCategoryAllocation] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showSplitCategoryModal, setShowSplitCategoryModal] = useState(false);
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [totalAllocatedAmount, setTotalAllocatedAmount] = useState('');
  const [increaseAmount, setIncreaseAmount] = useState('');
  const [categories] = useState(['Food', 'Transport', 'Entertainment', 'Shopping', 'Health', 'Other']);
  const [historyData, setHistoryData] = useState([]);


  // Initialize category allocation with 0 values
  useEffect(() => {
    const allocation = {};
    categories.forEach(cat => {
      allocation[cat] = '';
    });
    setCategoryAllocation(allocation);
  }, [categories]);

  // Fetch today's plan
  const fetchDailyPlan = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dailyPlannerService.getTodaysBudgets(userId);
      
      if (data && data.length > 0) {
        // Daily plan exists
        const plan = data[0];
        setDailyPlan(plan);
        setTotalAllocatedAmount(plan.totalDailyBudget.toString());
        
        // Build category allocation
        const allocation = {};
        categories.forEach(cat => {
          const categoryBudget = data.find(b => b.category === cat);
          allocation[cat] = categoryBudget ? categoryBudget.allocatedAmount.toString() : '';
        });
        setCategoryAllocation(allocation);
      } else {
        // No daily plan for today
        setDailyPlan(null);
        setTotalAllocatedAmount('');
      }
    } catch (err) {
      setError('Failed to load daily plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    try {
      const data = await dailyPlannerService.getBudgetHistory(userId, 7);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  useEffect(() => {
    fetchDailyPlan();
  }, [userId]);

  // Handle creating initial daily plan
  const handleCreateDailyPlan = async () => {
    const amount = parseFloat(totalAllocatedAmount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      // Create a placeholder budget entry to store the daily total
      await dailyPlannerService.createOrUpdateBudget({
        userId,
        category: 'Daily-Plan',
        totalDailyBudget: amount,
        allocatedAmount: 0,
        actualSpending: 0,
        status: 'On-Track',
        notes: 'Daily Plan Total'
      });

      setShowAddPlanModal(false);
      setError('');
      await fetchDailyPlan();
    } catch (err) {
      setError('Failed to create daily plan');
      console.error(err);
    }
  };

  // Handle category allocation
  const handleSaveAllocation = async () => {
    const total = parseFloat(totalAllocatedAmount) || 0;
    let allocatedSum = 0;
    const hasAtLeastOne = Object.values(categoryAllocation).some(val => val && parseFloat(val) > 0);

    if (!hasAtLeastOne) {
      setError('Please allocate amount to at least one category');
      return;
    }

    // Calculate total allocated
    Object.values(categoryAllocation).forEach(val => {
      if (val && !isNaN(val)) {
        allocatedSum += parseFloat(val);
      }
    });

    if (allocatedSum > total) {
      setError(`Total allocation (Rs${allocatedSum.toFixed(2)}) exceeds daily plan (Rs${total.toFixed(2)})`);
      return;
    }

    try {
      // Save each category allocation
      for (const [category, amount] of Object.entries(categoryAllocation)) {
        if (amount && parseFloat(amount) > 0) {
          await dailyPlannerService.createOrUpdateBudget({
            userId,
            category,
            totalDailyBudget: total,
            allocatedAmount: parseFloat(amount),
            actualSpending: 0,
            status: 'On-Track',
            notes: ''
          });
        }
      }

      setShowSplitCategoryModal(false);
      setError('');
      await fetchDailyPlan();
    } catch (err) {
      setError('Failed to save allocation');
      console.error(err);
    }
  };

  // Handle increase daily plan
  const handleIncreaseDailyPlan = async () => {
    const increase = parseFloat(increaseAmount);
    if (!increase || increase <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      const newTotal = parseFloat(totalAllocatedAmount) + increase;
      setTotalAllocatedAmount(newTotal.toString());

      // Update daily plan total
      await dailyPlannerService.createOrUpdateBudget({
        userId,
        category: 'Daily-Plan',
        totalDailyBudget: newTotal,
        allocatedAmount: 0,
        actualSpending: 0,
        status: 'On-Track',
        notes: 'Daily Plan Total'
      });

      setShowIncreaseModal(false);
      setIncreaseAmount('');
      setError('');
      await fetchDailyPlan();
    } catch (err) {
      setError('Failed to increase plan');
      console.error(err);
    }
  };

  // Calculate remaining allocation
  const calculateRemaining = () => {
    const total = parseFloat(totalAllocatedAmount) || 0;
    let allocated = 0;
    Object.values(categoryAllocation).forEach(val => {
      if (val && !isNaN(val)) {
        allocated += parseFloat(val);
      }
    });
    return (total - allocated).toFixed(2);
  };

  // Get color based on usage percentage
  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#e74c3c';
    if (percentage >= 80) return '#f39c12';
    return '#27ae60';
  };

  return (
    <div className="daily-planner-container">
      <div className="daily-planner-header">
        <h3>Daily Planner</h3>
        <button 
          className="btn-icon-small" 
          onClick={() => {
            setShowHistory(true);
            fetchHistory();
          }}
          title="View History"
        >
          <FaHistory />
        </button>
      </div>

      {/* No Daily Plan - Show "Add a plan for the day" button */}
      {!dailyPlan ? (
        <div className="no-plan-section">
          <div className="empty-state">
            <p>📅 No plan set for today</p>
            <button 
              className="btn-add-plan"
              onClick={() => setShowAddPlanModal(true)}
            >
              <FaPlus /> Add a plan for the day
            </button>
          </div>
        </div>
      ) : (
        // Daily Plan Exists
        <div className="daily-plan-section">
          {/* Total Daily Allocation Card */}
          <div className="plan-summary-card">
            <div className="plan-header">
              <h4>Daily Allocation</h4>
              <button 
                className="btn-increase-plan"
                onClick={() => setShowIncreaseModal(true)}
                title="Increase daily allocation"
              >
                <FaPlus />
              </button>
            </div>
            <div className="plan-total">
              <span className="plan-amount">Rs{parseFloat(totalAllocatedAmount).toFixed(2)}</span>
            </div>
          </div>

          {/* Category Allocation Summary */}
          <div className="category-summary">
            <div className="summary-header">
              <h5>Category Breakdown</h5>
              <button 
                className="btn-split-category"
                onClick={() => setShowSplitCategoryModal(true)}
              >
                Split Category
              </button>
            </div>

            {Object.entries(categoryAllocation)
              .filter(([_, amount]) => amount && parseFloat(amount) > 0)
              .map(([category, amount]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-amount">Rs{parseFloat(amount).toFixed(2)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {error && <div className="alert-error">{error}</div>}


      {/* Add Plan Modal */}
      {showAddPlanModal && (
        <div className="modal-overlay" onClick={() => setShowAddPlanModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Add a plan for the day</h4>
            <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
              Enter your total allocation for today
            </p>
            <div className="form-group">
              <label>Total Daily Amount (Rs)</label>
              <input
                type="number"
                placeholder="e.g., 1000"
                value={totalAllocatedAmount}
                onChange={(e) => setTotalAllocatedAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
            {error && <div className="alert-error" style={{ marginBottom: '12px' }}>{error}</div>}
            <div className="modal-buttons">
              <button 
                className="btn-cancel" 
                onClick={() => { setShowAddPlanModal(false); setError(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleCreateDailyPlan}
              >
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Category Modal */}
      {showSplitCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowSplitCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Split Category</h4>
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Allocate your daily amount (Rs{parseFloat(totalAllocatedAmount).toFixed(2)}) across categories
            </p>

            <div className="split-category-list">
              {categories.map((category) => (
                <div key={category} className="split-category-item">
                  <label>{category}</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={categoryAllocation[category] || ''}
                    onChange={(e) => setCategoryAllocation({
                      ...categoryAllocation,
                      [category]: e.target.value
                    })}
                    min="0"
                    step="0.01"
                  />
                </div>
              ))}
            </div>

            {/* Remaining amount display */}
            <div className="remaining-amount">
              <span>Remaining:</span>
              <span className={`amount ${parseFloat(calculateRemaining()) < 0 ? 'negative' : ''}`}>
                Rs{calculateRemaining()}
              </span>
            </div>

            {error && <div className="alert-error" style={{ marginBottom: '12px' }}>{error}</div>}

            <div className="modal-buttons">
              <button 
                className="btn-cancel" 
                onClick={() => { setShowSplitCategoryModal(false); setError(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleSaveAllocation}
              >
                Save Allocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Increase Plan Modal */}
      {showIncreaseModal && (
        <div className="modal-overlay" onClick={() => setShowIncreaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>Increase Daily Allocation</h4>
            <p style={{ color: '#666', marginBottom: '16px', textAlign: 'center' }}>
              Current: <strong>Rs{parseFloat(totalAllocatedAmount).toFixed(2)}</strong>
            </p>
            <div className="form-group">
              <label>Increase By (Rs)</label>
              <input
                type="number"
                placeholder="e.g., 200"
                value={increaseAmount}
                onChange={(e) => setIncreaseAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
              />
            </div>
            <div className="form-group budget-info-box">
              <div className="info-row">
                <span>New Total:</span>
                <span className="info-value">
                  Rs{(parseFloat(totalAllocatedAmount) + (parseFloat(increaseAmount) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
            {error && <div className="alert-error" style={{ marginBottom: '12px' }}>{error}</div>}
            <div className="modal-buttons">
              <button 
                className="btn-cancel" 
                onClick={() => { setShowIncreaseModal(false); setError(''); }}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleIncreaseDailyPlan}
              >
                Increase
              </button>
            </div>
          </div>
        </div>
      )}
      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h4>History (Last 7 Days)</h4>
            <div className="history-container">
              {historyData.length > 0 ? (
                historyData.map((item, index) => (
                  <div key={item.id || index} className="history-day">
                    <div className="history-date">
                      {new Date(item.date).toLocaleDateString('en-IN', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                      <br />
                      <small>{item.category}</small>
                    </div>
                    <div className="history-amounts">
                      Rs{item.actualSpending?.toFixed(0)} / Rs{item.allocatedAmount?.toFixed(0)}
                    </div>
                    <div className="history-bar">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.min((item.actualSpending / item.allocatedAmount) * 100, 100)}%`,
                          backgroundColor: getProgressColor((item.actualSpending / item.allocatedAmount) * 100)
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">No history available</div>
              )}
            </div>
            <button 
              className="btn-cancel" 
              style={{ marginTop: '16px', width: '100%' }} 
              onClick={() => setShowHistory(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPlanner;
