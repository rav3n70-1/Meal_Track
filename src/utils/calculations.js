// Utility functions for expense calculations and balance summaries

/**
 * Calculate balance summary for all household members
 * @param {Array} expenses - Array of approved expenses
 * @param {Array} members - Array of household members
 * @returns {Object} Balance summary with totals and individual balances
 */
export const calculateBalances = (expenses, members) => {
  // Filter only approved expenses
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');

  // Initialize member balances
  const memberBalances = {};
  members.forEach(member => {
    memberBalances[member.uid] = {
      name: member.name,
      email: member.email,
      photoURL: member.photoURL,
      totalPaid: 0,
      totalShare: 0,
      balance: 0,
      expenseCount: 0
    };
  });

  // Calculate totals
  let grandTotal = 0;

  approvedExpenses.forEach(expense => {
    const amount = parseFloat(expense.amount) || 0;
    grandTotal += amount;

    // Add to buyer's total paid
    if (memberBalances[expense.buyer]) {
      memberBalances[expense.buyer].totalPaid += amount;
      memberBalances[expense.buyer].expenseCount += 1;
    }

    // Calculate share per person
    const sharedAmong = expense.sharedAmong || [];
    const sharePerPerson = sharedAmong.length > 0 ? amount / sharedAmong.length : 0;

    // Add to each person's share
    sharedAmong.forEach(memberId => {
      if (memberBalances[memberId]) {
        memberBalances[memberId].totalShare += sharePerPerson;
      }
    });
  });

  // Calculate final balance for each member
  Object.keys(memberBalances).forEach(uid => {
    memberBalances[uid].balance = 
      memberBalances[uid].totalPaid - memberBalances[uid].totalShare;
  });

  return {
    grandTotal,
    memberBalances
  };
};

/**
 * Calculate who owes whom
 * @param {Object} memberBalances - Member balances from calculateBalances
 * @returns {Array} Array of debt relationships
 */
export const calculateDebts = (memberBalances) => {
  const debts = [];
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = [];
  const debtors = [];

  Object.entries(memberBalances).forEach(([uid, data]) => {
    if (data.balance > 0.01) { // Small threshold for floating point errors
      creditors.push({ uid, ...data });
    } else if (data.balance < -0.01) {
      debtors.push({ uid, ...data });
    }
  });

  // Sort by absolute balance
  creditors.sort((a, b) => b.balance - a.balance);
  debtors.sort((a, b) => a.balance - b.balance);

  // Calculate settlements
  let i = 0, j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

    if (amount > 0.01) {
      debts.push({
        from: debtor.uid,
        fromName: debtor.name,
        to: creditor.uid,
        toName: creditor.name,
        amount: Math.round(amount * 100) / 100 // Round to 2 decimal places
      });
    }

    creditor.balance -= amount;
    debtor.balance += amount;

    if (creditor.balance < 0.01) i++;
    if (Math.abs(debtor.balance) < 0.01) j++;
  }

  return debts;
};

/**
 * Filter expenses by date range
 * @param {Array} expenses - Array of expenses
 * @param {string} range - 'week', 'month', 'year', or 'all'
 * @returns {Array} Filtered expenses
 */
export const filterExpensesByDate = (expenses, range) => {
  if (range === 'all') return expenses;

  const now = new Date();
  const startDate = new Date();

  switch (range) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return expenses;
  }

  return expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startDate && expenseDate <= now;
  });
};

/**
 * Get expense statistics
 * @param {Array} expenses - Array of expenses
 * @returns {Object} Statistics object
 */
export const getExpenseStats = (expenses) => {
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
  const pendingExpenses = expenses.filter(exp => exp.status === 'pending');
  const rejectedExpenses = expenses.filter(exp => exp.status === 'rejected');

  const total = approvedExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const average = approvedExpenses.length > 0 ? total / approvedExpenses.length : 0;

  return {
    totalApproved: approvedExpenses.length,
    totalPending: pendingExpenses.length,
    totalRejected: rejectedExpenses.length,
    totalAmount: Math.round(total * 100) / 100,
    averageAmount: Math.round(average * 100) / 100
  };
};

/**
 * Group expenses by date for charts
 * @param {Array} expenses - Array of expenses
 * @param {string} groupBy - 'day', 'week', 'month'
 * @returns {Array} Grouped expenses data
 */
export const groupExpensesByDate = (expenses, groupBy = 'day') => {
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
  const grouped = {};

  approvedExpenses.forEach(expense => {
    const date = new Date(expense.date);
    let key;

    switch (groupBy) {
      case 'week':
        // Get week number
        const onejan = new Date(date.getFullYear(), 0, 1);
        const week = Math.ceil((((date - onejan) / 86400000) + onejan.getDay() + 1) / 7);
        key = `Week ${week}`;
        break;
      case 'month':
        key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        break;
      default:
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    if (!grouped[key]) {
      grouped[key] = 0;
    }
    grouped[key] += parseFloat(expense.amount || 0);
  });

  return Object.entries(grouped).map(([name, amount]) => ({
    name,
    amount: Math.round(amount * 100) / 100
  }));
};

