/**
 * exportService.js
 * Service for exporting financial data to CSV format
 * Allows users to download their current month's transactions
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
    const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

    return allData.filter((item) => {
      if (!item.dateAdded) return false;
      const itemDate = new Date(item.dateAdded);
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth() + 1;
      return itemYear === currentYear && itemMonth === currentMonth;
    });
  },

  /**
   * generateCSVContent - Create CSV formatted string from expense/income data
   * @param {string} dataType - Type of data: 'expenses' or 'income' or 'combined'
   * @param {Array} expenses - Array of expense objects
   * @param {Array} income - Array of income objects (optional, for combined)
   * @returns {string} CSV formatted content
   */
  generateCSVContent: (dataType, expenses = [], income = []) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const now = new Date();
    const monthYear = `${now.toLocaleString("default", {
      month: "long",
    })} ${now.getFullYear()}`;

    if (dataType === "expenses" || dataType === "combined") {
      // Expenses CSV Header
      csvContent += `EXPENSES - ${monthYear}\n`;
      csvContent += "Date,Category,Amount (Rs),Description\n";

      expenses.forEach((expense) => {
        const date = new Date(expense.dateAdded).toLocaleDateString();
        const category = expense.category || "Uncategorized";
        const amount = expense.amount || 0;
        const description = `Expense ID: ${expense.id}`;
        csvContent += `${date},"${category}",${amount},"${description}"\n`;
      });

      if (dataType === "combined") {
        csvContent += "\n";
      }
    }

    if (dataType === "income" || dataType === "combined") {
      // Income CSV Header
      csvContent += `INCOME - ${monthYear}\n`;
      csvContent += "Date,Source,Amount (Rs),Description\n";

      income.forEach((inc) => {
        const date = new Date(inc.dateAdded).toLocaleDateString();
        const source = inc.source || "Other Income";
        const amount = inc.amount || 0;
        const description = `Income ID: ${inc.id}`;
        csvContent += `${date},"${source}",${amount},"${description}"\n`;
      });

      if (dataType === "combined") {
        // Summary
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalIncome = income.reduce((sum, i) => sum + (i.amount || 0), 0);
        const netBalance = totalIncome - totalExpenses;

        csvContent += "\nSUMMARY\n";
        csvContent += `Total Income,Rs ${totalIncome.toFixed(2)}\n`;
        csvContent += `Total Expenses,Rs ${totalExpenses.toFixed(2)}\n`;
        csvContent += `Net Balance,Rs ${netBalance.toFixed(2)}\n`;
      }
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
   * exportCurrentMonthData - Main export function for user data
   * @param {number} userId - User ID to fetch data for
   * @param {string} dataType - 'expenses', 'income', or 'combined'
   * @returns {Promise<void>}
   */
  exportCurrentMonthData: async (userId, dataType = "combined") => {
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
        income
      );

      // Create filename with current month/year
      const now = new Date();
      const filename = `MoneyMates_${dataType}_${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}.csv`;

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
