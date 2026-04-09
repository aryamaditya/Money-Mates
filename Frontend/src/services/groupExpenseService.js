/**
 * groupExpenseService.js - Service for group expense API calls
 */

const BASE_URL = 'http://localhost:5262/api/groupexpense';

/**
 * Add a new group expense
 * @param {number} groupId - Group ID
 * @param {number} paidByUserId - User ID who paid
 * @param {string} description - Expense description
 * @param {number} amount - Total amount
 * @param {string} category - Expense category (optional)
 * @param {File} billImageFile - Bill image file (optional)
 * @param {Array} customSplits - Custom splits array: [{userId, amount}, ...] (optional)
 * @returns {Promise<Object>} - Created expense data
 */
export const addGroupExpense = async (groupId, paidByUserId, description, amount, category = null, billImageFile = null, customSplits = null) => {
  try {
    console.log('addGroupExpense service called', {
      groupId,
      paidByUserId,
      description,
      amount,
      category,
      hasBillImage: !!billImageFile,
      billImageFileName: billImageFile ? billImageFile.name : null,
      customSplits,
    });

    // Use FormData for multipart/form-data request
    const formData = new FormData();
    formData.append('groupId', groupId);
    formData.append('paidByUserId', paidByUserId);
    formData.append('description', description);
    formData.append('amount', amount);
    if (category) formData.append('category', category);
    
    // Add bill image file if provided
    if (billImageFile) {
      formData.append('billImage', billImageFile);
      console.log(`Adding bill image file: ${billImageFile.name} (${billImageFile.size} bytes)`);
    }

    // Add custom splits if provided
    if (customSplits && customSplits.length > 0) {
      customSplits.forEach((split, index) => {
        formData.append(`customSplits[${index}].userId`, split.userId);
        formData.append(`customSplits[${index}].amount`, split.amount);
      });
    }

    const response = await fetch(`${BASE_URL}/add`, {
      method: 'POST',
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error adding expense: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Expense added successfully:', result);
    return result;
  } catch (error) {
    console.error('Error in addGroupExpense:', error);
    throw error;
  }
};

/**
 * Get all expenses for a group
 * @param {number} groupId - Group ID
 * @returns {Promise<Array>} - List of group expenses
 */
export const getGroupExpenses = async (groupId) => {
  try {
    const response = await fetch(`${BASE_URL}/group/${groupId}`);

    if (!response.ok) {
      throw new Error(`Error fetching group expenses: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getGroupExpenses:', error);
    throw error;
  }
};

/**
 * Get expense summary for a user in a group
 * @param {number} groupId - Group ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} - Expense summary with balances
 */
export const getExpenseSummary = async (groupId, userId) => {
  try {
    const response = await fetch(`${BASE_URL}/summary/${groupId}/${userId}`);

    if (!response.ok) {
      throw new Error(`Error fetching expense summary: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getExpenseSummary:', error);
    throw error;
  }
};

/**
 * Confirm an expense (acknowledge the split)
 * @param {number} expenseId - Expense ID
 * @param {number} userId - User ID confirming
 * @returns {Promise<Object>} - Response message
 */
export const confirmExpense = async (expenseId, userId) => {
  try {
    const response = await fetch(`${BASE_URL}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expenseId,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error confirming expense: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in confirmExpense:', error);
    throw error;
  }
};

/**
 * Settle an expense
 * @param {number} expenseId - Expense ID
 * @param {number} userIdOwes - User ID who owes
 * @param {File} settlementImageFile - Settlement proof image file (optional)
 * @returns {Promise<Object>} - Response message
 */
export const settleExpense = async (expenseId, userIdOwes, settlementImageFile = null) => {
  try {
    console.log('settleExpense service called', {
      expenseId,
      userIdOwes,
      hasImage: !!settlementImageFile,
      fileName: settlementImageFile ? settlementImageFile.name : null,
    });

    // Use FormData for multipart/form-data request
    const formData = new FormData();
    formData.append('expenseId', expenseId);
    formData.append('userIdOwes', userIdOwes);

    // Add settlement image file if provided
    if (settlementImageFile) {
      formData.append('settlementImage', settlementImageFile);
      console.log(`Adding settlement image file: ${settlementImageFile.name} (${settlementImageFile.size} bytes)`);
    }

    const response = await fetch(`${BASE_URL}/settle`, {
      method: 'POST',
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error settling expense: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in settleExpense:', error);
    throw error;
  }
};

/**
 * Delete a group expense
 * @param {number} expenseId - Expense ID
 * @returns {Promise<Object>} - Response message
 */
export const deleteGroupExpense = async (expenseId) => {
  try {
    const response = await fetch(`${BASE_URL}/${expenseId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Error deleting expense: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in deleteGroupExpense:', error);
    throw error;
  }
};
