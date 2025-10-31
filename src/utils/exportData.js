// Utility functions for exporting data to Excel/CSV
import * as XLSX from 'xlsx';

/**
 * Export expenses to Excel
 * @param {Array} expenses - Array of expenses
 * @param {Array} members - Array of household members
 * @param {string} filename - Output filename
 */
export const exportToExcel = (expenses, members, filename = 'expenses.xlsx') => {
  // Create member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member.name;
  });

  // Prepare expense data
  const expenseData = expenses.map(expense => ({
    'Date': new Date(expense.date).toLocaleDateString(),
    'Item': expense.item,
    'Amount': expense.amount,
    'Buyer': memberLookup[expense.buyer] || 'Unknown',
    'Shared Among': (expense.sharedAmong || [])
      .map(uid => memberLookup[uid] || 'Unknown')
      .join(', '),
    'Status': expense.status,
    'Notes': expense.notes || '',
    'Created At': new Date(expense.createdAt).toLocaleDateString()
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add expenses sheet
  const ws = XLSX.utils.json_to_sheet(expenseData);
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

  // Download file
  XLSX.writeFile(wb, filename);
};

/**
 * Export balance summary to Excel
 * @param {Object} balances - Balance data from calculateBalances
 * @param {Array} debts - Debt relationships from calculateDebts
 * @param {string} filename - Output filename
 */
export const exportBalancesToExcel = (balances, debts, filename = 'balances.xlsx') => {
  // Prepare balance data
  const balanceData = Object.values(balances).map(member => ({
    'Name': member.name,
    'Email': member.email,
    'Total Paid': member.totalPaid.toFixed(2),
    'Total Share': member.totalShare.toFixed(2),
    'Balance': member.balance.toFixed(2),
    'Expense Count': member.expenseCount
  }));

  // Prepare debt data
  const debtData = debts.map(debt => ({
    'From': debt.fromName,
    'To': debt.toName,
    'Amount': debt.amount.toFixed(2)
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Add balances sheet
  const ws1 = XLSX.utils.json_to_sheet(balanceData);
  XLSX.utils.book_append_sheet(wb, ws1, 'Balances');

  // Add debts sheet
  const ws2 = XLSX.utils.json_to_sheet(debtData);
  XLSX.utils.book_append_sheet(wb, ws2, 'Who Owes Whom');

  // Download file
  XLSX.writeFile(wb, filename);
};

/**
 * Export to CSV
 * @param {Array} expenses - Array of expenses
 * @param {Array} members - Array of household members
 * @param {string} filename - Output filename
 */
export const exportToCSV = (expenses, members, filename = 'expenses.csv') => {
  // Create member lookup
  const memberLookup = {};
  members.forEach(member => {
    memberLookup[member.uid] = member.name;
  });

  // Prepare expense data
  const expenseData = expenses.map(expense => ({
    'Date': new Date(expense.date).toLocaleDateString(),
    'Item': expense.item,
    'Amount': expense.amount,
    'Buyer': memberLookup[expense.buyer] || 'Unknown',
    'Shared Among': (expense.sharedAmong || [])
      .map(uid => memberLookup[uid] || 'Unknown')
      .join('; '),
    'Status': expense.status,
    'Notes': expense.notes || '',
    'Created At': new Date(expense.createdAt).toLocaleDateString()
  }));

  // Create workbook and export as CSV
  const ws = XLSX.utils.json_to_sheet(expenseData);
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Download file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

