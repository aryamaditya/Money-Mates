/**
 * exportService.js - ENHANCED
 * Service for exporting financial data to CSV format with improved features
 * Allows users to download their current month's transactions with detailed analysis
 */

import expenseService from "./expenseService";
import incomeService from "./incomeService";

const exportService = {
  /**
   * getFilteredDataForCurrentMonth - Filter expenses and income for current month/year
   * @param {Array} allData - Array of data objects with dateAdded property
   * @returns {Array} Filtered data for current month
   */
  getFilteredDataForCurrentMonth: (allData) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return allData.filter((item) => {
      if (!item.dateAdded) return false;
      const itemDate = new Date(item.dateAdded);
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth() + 1;
      return itemYear === currentYear && itemMonth === currentMonth;
    });
  },

  /**
   * formatDateWithDetails - Extract month, day of week from date
   * @param {string} dateString - ISO date string
   * @returns {Object} { date, month, dayOfWeek }
   */
  formatDateWithDetails: (dateString) => {
    const date = new Date(dateString);
    const dateFormatted = date.toLocaleDateString();
    const month = date.toLocaleString("default", { month: "long" });
    const dayOfWeek = date.toLocaleString("default", { weekday: "long" });
    return { date: dateFormatted, month, dayOfWeek };
  },

  /**
   * findHighestSpendingCategory - Get category with highest total spending
   * @param {Array} expenses - Array of expense objects
   * @returns {string} Category name with highest spending
   */
  findHighestSpendingCategory: (expenses) => {
    if (expenses.length === 0) return "N/A";
    
    const categoryTotals = {};
    expenses.forEach((expense) => {
      const category = expense.category || "Uncategorized";
      categoryTotals[category] = (categoryTotals[category] || 0) + (expense.amount || 0);
    });

    let highest = { category: "N/A", amount: 0 };
    for (const [category, total] of Object.entries(categoryTotals)) {
      if (total > highest.amount) {
        highest = { category, amount: total };
      }
    }

    return `${highest.category} (Rs ${highest.amount.toFixed(2)})`;
  },

  /**
   * getPeriodCovered - Get date range of transactions
   * @param {Array} expenses - Array of expense objects
   * @param {Array} income - Array of income objects
   * @returns {string} Date range string
   */
  getPeriodCovered: (expenses, income) => {
    const allTransactions = [...expenses, ...income];
    if (allTransactions.length === 0) return "No transactions";

    const dates = allTransactions.map(t => new Date(t.dateAdded));
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));

    return `${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`;
  },

  /**
   * generateCSVContent - Create CSV formatted string from expense/income data with enhancements
   * @param {string} dataType - Type of data: 'expenses' or 'income' or 'combined'
   * @param {Array} expenses - Array of expense objects
   * @param {Array} income - Array of income objects (optional, for combined)
   * @param {string} userName - User's name for header
   * @returns {string} CSV formatted content
   */
  generateCSVContent: (dataType, expenses = [], income = [], userName = "User") => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const now = new Date();
    const exportDate = now.toLocaleDateString();
    const monthYear = `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`;

    // Header Section
    csvContent += "APP NAME,Money Mates\n";
    csvContent += `EXPORTED BY,${userName}\n`;
    csvContent += `EXPORT DATE,${exportDate}\n`;
    csvContent += "\n";

    if (dataType === "expenses" || dataType === "combined") {
      // Sort expenses by date (newest first)
      const sortedExpenses = [...expenses].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

      // Expenses CSV Header
      csvContent += `EXPENSES - ${monthYear}\n`;
      csvContent += "Date,Month,Day of Week,Category,Amount (Rs),Description\n";

      sortedExpenses.forEach((expense) => {
        const dateDetails = exportService.formatDateWithDetails(expense.dateAdded);
        const category = expense.category || "Uncategorized";
        const amount = expense.amount || 0;
        const description = category; // Use category as description since Expense model doesn't have description field
        csvContent += `${dateDetails.date},"${dateDetails.month}","${dateDetails.dayOfWeek}","${category}",${amount},"${description}"\n`;
      });

      if (dataType === "combined") {
        csvContent += "\n";
      }
    }

    if (dataType === "income" || dataType === "combined") {
      // Sort income by date (newest first)
      const sortedIncome = [...income].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));

      // Income CSV Header
      csvContent += `INCOME - ${monthYear}\n`;
      csvContent += "Date,Month,Day of Week,Source,Amount (Rs),Description\n";

      sortedIncome.forEach((inc) => {
        const dateDetails = exportService.formatDateWithDetails(inc.dateAdded);
        const source = inc.source || "Other Income";
        const amount = inc.amount || 0;
        const description = source;
        csvContent += `${dateDetails.date},"${dateDetails.month}","${dateDetails.dayOfWeek}","${source}",${amount},"${description}"\n`;
      });

      if (dataType === "combined") {
        csvContent += "\n";
      }
    }

    if (dataType === "combined") {
      // Enhanced Summary Section
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
      const netBalance = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(2) : 0;
      const highestSpendingCategory = exportService.findHighestSpendingCategory(expenses);
      const periodCovered = exportService.getPeriodCovered(expenses, income);

      csvContent += "SUMMARY\n";
      csvContent += `Total Income,Rs ${totalIncome.toFixed(2)}\n`;
      csvContent += `Total Expenses,Rs ${totalExpenses.toFixed(2)}\n`;
      csvContent += `Net Balance,Rs ${netBalance.toFixed(2)}\n`;
      csvContent += `Savings Rate,${savingsRate}%\n`;
      csvContent += `Highest Spending Category,"${highestSpendingCategory}"\n`;
      csvContent += `Period Covered,"${periodCovered}"\n`;
      csvContent += `Export Date,${exportDate}\n`;
    }

    return csvContent;
  },

  /**
   * downloadCSV - Create and trigger download of CSV file
   * @param {string} csvContent - CSV formatted string from generateCSVContent
   * @param {string} filename - Name of the file to download
   */
  downloadCSV: (csvContent, filename) => {
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * exportCurrentMonthData - Main export function for user data with enhancements
   * @param {number} userId - User ID to fetch data for
   * @param {string} dataType - 'expenses', 'income', or 'combined'
   * @param {string} userName - User's name for header
   * @returns {Promise<void>}
   */
  exportCurrentMonthData: async (userId, dataType = "combined", userName = "User") => {
    try {
      let expenses = [];
      let income = [];

      // Fetch data based on type
      if (dataType === "expenses" || dataType === "combined") {
        const allExpenses = await expenseService.getUserExpenses(userId);
        expenses = exportService.getFilteredDataForCurrentMonth(allExpenses);
      }

      if (dataType === "income" || dataType === "combined") {
        const allIncome = await incomeService.getUserIncome(userId);
        income = exportService.getFilteredDataForCurrentMonth(allIncome);
      }

      // Generate CSV content
      const csvContent = exportService.generateCSVContent(
        dataType,
        expenses,
        income,
        userName
      );

      // Create filename with today's date in YYYY-MM-DD format
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const filename = `MoneyMates_Export_${year}-${month}-${day}.csv`;

      // Download file
      exportService.downloadCSV(csvContent, filename);
    } catch (error) {
      console.error("Export failed:", error);
      throw new Error(
        `Failed to export ${dataType}: ${error.message}`
      );
    }
  },
};

export default exportService;
