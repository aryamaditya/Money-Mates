import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaSpinner, FaTimes, FaCheck, FaTrash, FaHandshake, FaImage } from 'react-icons/fa';
import * as groupExpenseService from '../services/groupExpenseService';
import './GroupExpense.css';

const GroupExpense = ({ groupId, userId, groupMembers = [] }) => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [splitMode, setSplitMode] = useState('equal'); // 'equal' or 'custom'
  
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Food',
    billImage: null,
    billImagePreview: null,
  });

  // Custom splits: { [userId]: amount }
  const [customSplits, setCustomSplits] = useState({});

  // Settlement modal state
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleData, setSettleData] = useState({
    expenseId: null,
    userIdOwes: null,
    settlementImage: null,
    settlementImagePreview: null,
  });

  // Refs for file inputs
  const billImageInputRef = useRef(null);
  const settlementImageInputRef = useRef(null);

  useEffect(() => {
    if (groupId) {
      fetchExpenses();
      fetchSummary();
    }
  }, [groupId, userId]);

  // Initialize custom splits when form opens
  useEffect(() => {
    if (showAddExpense && groupMembers.length > 0) {
      const initialSplits = {};
      groupMembers.forEach(member => {
        initialSplits[member.userId] = 0;
      });
      setCustomSplits(initialSplits);
    }
  }, [showAddExpense, groupMembers]);

  // Reset file inputs when modals close
  useEffect(() => {
    if (!showSettleModal && settlementImageInputRef.current) {
      settlementImageInputRef.current.value = '';
    }
    if (!showAddExpense && billImageInputRef.current) {
      billImageInputRef.current.value = '';
    }
  }, [showSettleModal, showAddExpense]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await groupExpenseService.getGroupExpenses(groupId);
      setExpenses(data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await groupExpenseService.getExpenseSummary(groupId, userId);
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };
  const handleImageChange = (e, isSettlement = false) => {
    const file = e.target.files[0];
    console.log(`handleImageChange called - isSettlement: ${isSettlement}, file: ${file ? file.name : 'null'}`);
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Create preview using FileReader
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log(`FileReader finished - preview ready`);
        if (isSettlement) {
          setSettleData(prevData => ({
            ...prevData,
            settlementImage: file, // Store the File object
            settlementImagePreview: reader.result, // For preview only
          }));
          console.log('Settlement image updated in state:', file.name);
        } else {
          setFormData(prevData => ({
            ...prevData,
            billImage: file, // Store the File object
            billImagePreview: reader.result, // For preview only
          }));
          console.log('Bill image updated in state:', file.name);
        }
      };
      reader.readAsDataURL(file);
    } else {
      console.log('No file selected');
    }
  };
  const handleAddExpense = async (e) => {
    e.preventDefault();
    console.log('handleAddExpense called with formData:', {
      description: formData.description,
      amount: formData.amount,
      category: formData.category,
      hasBillImage: !!formData.billImage,
      billImageName: formData.billImage ? formData.billImage.name : null,
    });

    // Validate description
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    // Validate amount
    if (!formData.amount) {
      setError('Amount is required');
      return;
    }

    // Check if amount is a valid number
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum)) {
      setError('Amount must be a valid number');
      return;
    }

    // Check if amount is greater than zero
    if (amountNum <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    // Validate custom splits if in custom mode
    if (splitMode === 'custom') {
      const totalSplit = Object.values(customSplits).reduce((sum, val) => sum + parseFloat(val || 0), 0);
      if (Math.abs(totalSplit - parseFloat(formData.amount)) > 0.01) {
        setError(`Custom splits must sum to Rs${parseFloat(formData.amount).toFixed(2)}. Current total: Rs${totalSplit.toFixed(2)}`);
        return;
      }
    }

    try {
      setLoading(true);
      const splits = splitMode === 'custom' 
        ? Object.entries(customSplits).map(([memberId, amount]) => ({
            userId: parseInt(memberId),
            amount: parseFloat(amount || 0)
          })).filter(s => s.amount > 0)
        : null;

      console.log('About to call addGroupExpense with billImageFile:', formData.billImage ? formData.billImage.name : 'none');

      await groupExpenseService.addGroupExpense(
        groupId,
        userId,
        formData.description,
        parseFloat(formData.amount),
        formData.category,
        formData.billImage, // Pass File object instead of base64
        splits
      );
      setSuccess('Expense added successfully!');
      setFormData({ description: '', amount: '', category: 'Food', billImage: null, billImagePreview: null });
      setSplitMode('equal');
      setShowAddExpense(false);
      await fetchExpenses();
      await fetchSummary();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to add expense:', err);
      setError(err.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      setLoading(true);
      await groupExpenseService.deleteGroupExpense(expenseId);
      setSuccess('Expense deleted successfully!');
      await fetchExpenses();
      await fetchSummary();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setError(err.message || 'Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const handleSettleExpense = (expenseId, userIdOwes) => {
    setSettleData({
      expenseId,
      userIdOwes,
      settlementImage: null,
      settlementImagePreview: null,
    });
    setShowSettleModal(true);
  };

  const handleConfirmSettle = async () => {
    console.log('handleConfirmSettle called');
    console.log('settleData:', settleData);
    
    if (!settleData.expenseId || !settleData.userIdOwes) {
      setError('Invalid settlement data');
      return;
    }

    try {
      setLoading(true);
      console.log(`Calling settleExpense with - expenseId: ${settleData.expenseId}, userIdOwes: ${settleData.userIdOwes}, hasImage: ${!!settleData.settlementImage}`);
      
      await groupExpenseService.settleExpense(
        settleData.expenseId,
        settleData.userIdOwes,
        settleData.settlementImage // Pass File object instead of base64
      );
      setSuccess('Expense settled!');
      setShowSettleModal(false);
      setSettleData({
        expenseId: null,
        userIdOwes: null,
        settlementImage: null,
        settlementImagePreview: null,
      });
      // Reset file input
      if (settlementImageInputRef.current) {
        settlementImageInputRef.current.value = '';
      }
      await fetchExpenses();
      await fetchSummary();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to settle expense:', err);
      setError(err.message || 'Failed to settle expense');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmExpense = async (expenseId) => {
    try {
      setLoading(true);
      const response = await groupExpenseService.confirmExpense(expenseId, userId);
      setSuccess(response.message);
      await fetchExpenses();
      await fetchSummary();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to confirm expense:', err);
      setError(err.message || 'Failed to confirm expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="group-expense-container">
      {/* Header */}
      <div className="expense-header">
        <h2>Group Expenses</h2>
        <button
          className="btn-add-expense"
          onClick={() => setShowAddExpense(!showAddExpense)}
          disabled={loading}
        >
          <FaPlus /> Add Expense
        </button>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="alert alert-error">
          <FaTimes /> {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <FaCheck /> {success}
        </div>
      )}

      {/* Add Expense Form */}
      {showAddExpense && (
        <div className="add-expense-form">
          <form onSubmit={handleAddExpense}>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                placeholder="e.g., Dinner at restaurant"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Amount (Rs)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  max="999999"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
                <small className="form-hint">Amount must be greater than 0</small>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option>Food</option>
                  <option>Groceries</option>
                  <option>Entertainment</option>
                  <option>Transportation</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Split Mode Toggle */}
            <div className="split-mode-toggle">
              <label>Split Type:</label>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-btn ${splitMode === 'equal' ? 'active' : ''}`}
                  onClick={() => setSplitMode('equal')}
                >
                  Equal Split
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${splitMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setSplitMode('custom')}
                >
                  Custom Split
                </button>
              </div>
            </div>

            {/* Bill Image Upload */}
            <div className="form-group">
              <label>Bill Photo (Optional)</label>
              <div className="image-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  ref={billImageInputRef}
                  onChange={(e) => handleImageChange(e, false)}
                  className="image-input"
                  id="billImageInput"
                />
                <label htmlFor="billImageInput" className="image-upload-label">
                  <FaImage /> Choose Bill Photo
                </label>
              </div>
              {formData.billImagePreview && (
                <div className="image-preview">
                  <img src={formData.billImagePreview} alt="Bill Preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => setFormData({ ...formData, billImage: null, billImagePreview: null })}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Custom Splits */}
            {splitMode === 'custom' && (
              <div className="custom-splits-section">
                <label>Define who owes what:</label>
                <div className="splits-breakdown">
                  {groupMembers.map(member => (
                    <div key={member.userId} className="split-input-row">
                      <span className="member-label">{member.name}</span>
                      <div className="split-input-container">
                        <span className="currency">Rs</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          value={customSplits[member.userId] || ''}
                          onChange={(e) => {
                            setCustomSplits({
                              ...customSplits,
                              [member.userId]: e.target.value
                            });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {formData.amount && (
                  <div className="split-total">
                    <span>Total:</span>
                    <span className={Object.values(customSplits).reduce((sum, val) => sum + parseFloat(val || 0), 0) === parseFloat(formData.amount) ? 'match' : 'nomatch'}>
                      Rs{Object.values(customSplits).reduce((sum, val) => sum + parseFloat(val || 0), 0).toFixed(2)} / Rs{parseFloat(formData.amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? <FaSpinner className="spinner" /> : <FaPlus />} Add Expense
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowAddExpense(false);
                  setSplitMode('equal');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense Summary */}
      {summary && (
        <div className="expense-summary">
          <div className="summary-card">
            <h3>You Owe:</h3>
            {summary.youOwe && summary.youOwe.length > 0 ? (
              <div className="balance-list">
                {summary.youOwe.map((debt, idx) => (
                  <div key={idx} className="balance-item owes">
                    <div>
                      <strong>{debt.creditorName}</strong>
                      <p>{debt.creditorEmail}</p>
                    </div>
                    <div className="amount">Rs{debt.totalOwes.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-balance">All settled!</p>
            )}
          </div>

          <div className="summary-card">
            <h3>You Are Owed:</h3>
            {summary.youAreOwed && summary.youAreOwed.length > 0 ? (
              <div className="balance-list">
                {summary.youAreOwed.map((owed, idx) => (
                  <div key={idx} className="balance-item owed">
                    <div>
                      <strong>{owed.debtorName}</strong>
                      <p>{owed.debtorEmail}</p>
                    </div>
                    <div className="amount">Rs{owed.totalOwed.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-balance">All settled!</p>
            )}
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="expenses-list-section">
        <h3>Transaction History</h3>
        {loading && !expenses.length ? (
          <div className="loading-spinner">
            <FaSpinner className="spinner" />
            <p>Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="no-expenses">
            <p>No expenses yet. Add your first expense!</p>
          </div>
        ) : (
          <div className="expenses-list">
            {expenses.map((expense) => (
              <div key={expense.id} className="expense-card">
                <div className="expense-header-card">
                  <div>
                    <h4>{expense.description}</h4>
                    <p className="expense-category">{expense.category}</p>
                    <small>
                      Paid by <strong>{expense.paidBy}</strong> on {new Date(expense.dateAdded).toLocaleDateString()}
                    </small>
                  </div>
                  <div className="expense-amount">Rs{expense.amount.toFixed(2)}</div>
                </div>

                {/* Bill Image Display */}
                {expense.billImageUrl && (
                  <div className="expense-bill-image-section">
                    <img 
                      src={expense.billImageUrl} 
                      alt="Bill Receipt" 
                      className="expense-bill-image"
                      onClick={() => window.open(expense.billImageUrl)}
                      title="Click to view full image"
                    />
                  </div>
                )}

                {expense.splits && expense.splits.length > 0 && (
                  <div className="expense-splits">
                    <div className="splits-header">
                      <h5>Members & Confirmation:</h5>
                      {expense.allConfirmed ? (
                        <span className="confirmation-badge confirmed">✓ All Confirmed</span>
                      ) : (
                        <span className="confirmation-badge pending">Pending Confirmations</span>
                      )}
                    </div>
                    {expense.splits.map((split) => (
                      <div key={split.id} className="split-item">
                        <div className="split-info">
                          <div className="split-member">
                            <span className="member-name">{split.userOwes}</span>
                            <span className="member-amount">owes Rs{split.amount.toFixed(2)}</span>
                          </div>
                          <div className="split-status">
                            {split.isSettled ? (
                              <div className="settled-container">
                                <span className="settled-badge">Settled</span>
                                {split.settlementImageUrl && (
                                  <img src={split.settlementImageUrl} alt="Settlement Proof" className="settlement-image-thumbnail" title="Settlement proof" />
                                )}
                              </div>
                            ) : (
                              <>
                                <label className="checkbox-container">
                                  <input
                                    type="checkbox"
                                    checked={split.isConfirmed}
                                    onChange={() => {
                                      if (!split.isConfirmed && split.userOwesId === userId) {
                                        handleConfirmExpense(expense.id);
                                      }
                                    }}
                                    disabled={split.isConfirmed || split.userOwesId !== userId || loading}
                                  />
                                  <span className="checkmark"></span>
                                  {split.isConfirmed ? 'Confirmed' : 'Confirm'}
                                </label>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {expense.paidByUserId === userId && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteExpense(expense.id)}
                    disabled={loading}
                  >
                    <FaTrash /> Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settlement Modal */}
      {showSettleModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowSettleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Settle Expense</h3>
              <button
                className="modal-close"
                onClick={() => !loading && setShowSettleModal(false)}
                disabled={loading}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p>Upload settlement proof (optional):</p>

              <div className="image-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  ref={settlementImageInputRef}
                  onChange={(e) => handleImageChange(e, true)}
                  className="image-input"
                  id="settlementImageInput"
                  disabled={loading}
                />
                <label htmlFor="settlementImageInput" className="image-upload-label">
                  <FaImage /> Choose Settlement Photo
                </label>
              </div>

              {settleData.settlementImagePreview && (
                <div className="image-preview">
                  <img src={settleData.settlementImagePreview} alt="Settlement Preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => setSettleData({ ...settleData, settlementImage: null, settlementImagePreview: null })}
                    disabled={loading}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowSettleModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleConfirmSettle}
                disabled={loading}
              >
                {loading ? <FaSpinner className="spinner" /> : <FaCheck />} Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupExpense;
