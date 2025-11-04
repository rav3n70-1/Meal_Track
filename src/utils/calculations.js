// Utility functions for expense calculations and balance summaries
import { getDisplayName } from './displayName';

// Helper: get total amount of an expense regardless of schema
export const getExpenseTotalAmount = (expense) => {
  // Prefer explicit totalAmount
  if (expense && typeof expense.totalAmount !== 'undefined') {
    const amt = parseFloat(expense.totalAmount);
    return isNaN(amt) ? 0 : amt;
  }
  // Legacy single amount field
  if (expense && typeof expense.amount !== 'undefined') {
    const amt = parseFloat(expense.amount);
    return isNaN(amt) ? 0 : amt;
  }
  // Derive from items if present
  if (expense && Array.isArray(expense.items)) {
    return expense.items.reduce((sum, item) => sum + (parseFloat(item?.amount) || 0), 0);
  }
  return 0;
};

/**
 * Round shared amount to nearest 10 (same as debt rounding)
 * @param {number} amount - Total amount
 * @param {number} numberOfPeople - Number of people sharing
 * @returns {Object} Object with rounded amount and calculation details
 */
export const roundUpSharedAmount = (amount, numberOfPeople) => {
  if (!numberOfPeople || numberOfPeople === 0) {
    return {
      exact: 0,
      rounded: 0,
      calculation: `৳${amount.toFixed(2)} ÷ ${numberOfPeople} = ৳0.00 per person`
    };
  }
  
  const exact = amount / numberOfPeople;
  const rounded = Math.round(exact / 10) * 10; // Round to nearest 10 (same as debt rounding)
  const difference = rounded - exact;
  
  return {
    exact,
    rounded,
    difference,
    calculation: `৳${amount.toFixed(2)} ÷ ${numberOfPeople} = ৳${exact.toFixed(2)} (exact)
Rounded to nearest 10: ৳${rounded.toFixed(2)}`
  };
};

/**
 * Round debt amount to nearest 10
 * @param {number} amount - Original debt amount
 * @returns {Object} Object with rounded amount and calculation details
 */
export const roundDebtToNearestTen = (amount) => {
  const rounded = Math.round(amount / 10) * 10;
  
  return {
    original: amount,
    rounded,
    calculation: `৳${amount.toFixed(2)} rounded to nearest 10 = ৳${rounded.toFixed(2)}`
  };
};

// Helper: map of buyerUid -> total paid for a given expense (supports items per buyer)
const getBuyerPaymentsForExpense = (expense) => {
  const payments = {};
  if (Array.isArray(expense?.items) && expense.items.length > 0) {
    expense.items.forEach((item) => {
      const buyerId = item?.buyer;
      const amt = parseFloat(item?.amount) || 0;
      if (!buyerId || !amt) return;
      payments[buyerId] = (payments[buyerId] || 0) + amt;
    });
  } else if (expense?.buyer) {
    const amt = getExpenseTotalAmount(expense);
    if (amt > 0) payments[expense.buyer] = (payments[expense.buyer] || 0) + amt;
  }
  return payments;
};

// NEW: Compute contributions per member including debt repayments shifting shares
// Note: Only approved expenses should be passed to this function for charts
export const getContributionsByMember = (expenses, members, debts = []) => {
  const memberIdToName = Object.fromEntries(members.map(m => [m.uid, getDisplayName(m)]));
  const contributions = {};
  Object.keys(memberIdToName).forEach(uid => { contributions[uid] = 0; });

  // Base: sum purchases by buyer from expenses (should only be approved expenses)
  expenses.forEach(expense => {
    const buyerMap = getBuyerPaymentsForExpense(expense);
    Object.entries(buyerMap).forEach(([buyerId, amount]) => {
      contributions[buyerId] = (contributions[buyerId] || 0) + (parseFloat(amount) || 0);
    });
  });

  // Adjust with debt payments: move contribution from creditor to debtor as payments occur
  // Consider debts with payments array; include payments regardless of debt status except rejected
  const relevantDebts = Array.isArray(debts) ? debts.filter(d => d.status !== 'rejected') : [];
  relevantDebts.forEach(debt => {
    const creditor = debt.creditor;
    const payments = Array.isArray(debt.payments) ? debt.payments : [];
    payments.forEach(payment => {
      const paidBy = payment?.paidBy;
      const amount = parseFloat(payment?.amount) || 0;
      if (!paidBy || !amount) return;
      contributions[paidBy] = (contributions[paidBy] || 0) + amount;
      contributions[creditor] = (contributions[creditor] || 0) - amount;
    });
  });

  // Build output structure expected by charts: map uid -> { name, totalPaid }
  const result = {};
  Object.entries(memberIdToName).forEach(([uid, name]) => {
    const value = Math.max(0, Math.round((contributions[uid] || 0) * 100) / 100);
    result[uid] = { name, totalPaid: value };
  });
  return result;
};

/**
 * Calculate balance summary for all household members
 * @param {Array} expenses - Array of approved expenses
 * @param {Array} members - Array of household members
 * @param {Array} debts - Array of approved debts (optional)
 * @returns {Object} Balance summary with totals and individual balances
 */
export const calculateBalances = (expenses, members, debts = []) => {
  // Filter only approved expenses
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');

  // Initialize member balances
  const memberBalances = {};
  members.forEach(member => {
    memberBalances[member.uid] = {
      name: getDisplayName(member),
      fullName: member.name,
      email: member.email,
      photoURL: member.photoURL,
      nickname: member.nickname,
      totalPaid: 0,
      totalShare: 0,
      totalDebtOwed: 0, // Money they owe to others
      totalDebtCredit: 0, // Money others owe to them
      balance: 0,
      expenseCount: 0,
      debtCount: 0
    };
  });

  // Calculate totals
  let grandTotal = 0;

  approvedExpenses.forEach(expense => {
    const amount = getExpenseTotalAmount(expense);
    grandTotal += amount;

    // Add to buyer(s) total paid
    const buyerPayments = getBuyerPaymentsForExpense(expense);
    Object.entries(buyerPayments).forEach(([buyerId, buyerAmount]) => {
      if (memberBalances[buyerId]) {
        memberBalances[buyerId].totalPaid += buyerAmount;
        memberBalances[buyerId].expenseCount += 1;
      }
    });

    // Calculate share per person (rounded up)
    const sharedAmong = expense.sharedAmong || [];
    let sharePerPerson = 0;
    if (sharedAmong.length > 0) {
      const shareCalc = roundUpSharedAmount(amount, sharedAmong.length);
      sharePerPerson = shareCalc.rounded; // Use rounded up amount
    }

    // Add to each person's share
    sharedAmong.forEach(memberId => {
      if (memberBalances[memberId]) {
        memberBalances[memberId].totalShare += sharePerPerson;
      }
    });
  });

  // Adjust totals with debt payments: when a debtor pays, it counts as their Total Paid
  // and reduces the creditor's Total Paid accordingly (shifts contribution)
  if (Array.isArray(debts)) {
    debts
      .filter(d => d.status !== 'rejected')
      .forEach(debt => {
        const creditorId = debt?.creditor;
        const payments = Array.isArray(debt?.payments) ? debt.payments : [];
        payments.forEach(payment => {
          const paidBy = payment?.paidBy;
          const amount = parseFloat(payment?.amount) || 0;
          if (!amount) return;
          if (paidBy && memberBalances[paidBy]) {
            memberBalances[paidBy].totalPaid += amount;
          }
          if (creditorId && memberBalances[creditorId]) {
            memberBalances[creditorId].totalPaid -= amount;
          }
        });
      });
  }

  // Calculate debt balances (only approved and not fully paid debts)
  const activeDebts = debts.filter(debt => debt.status === 'approved' && debt.remainingAmount > 0);
  
  activeDebts.forEach(debt => {
    const remainingAmount = parseFloat(debt.remainingAmount) || 0;
    
    // Debtor owes money (negative impact on balance)
    if (memberBalances[debt.debtor]) {
      memberBalances[debt.debtor].totalDebtOwed += remainingAmount;
      memberBalances[debt.debtor].debtCount += 1;
    }
    
    // Creditor is owed money (positive impact on balance)
    if (memberBalances[debt.creditor]) {
      memberBalances[debt.creditor].totalDebtCredit += remainingAmount;
    }
  });

  // Calculate final balance for each member
  Object.keys(memberBalances).forEach(uid => {
    // Balance = (money paid - share of expenses) + (money owed to you - money you owe)
    memberBalances[uid].balance = 
      memberBalances[uid].totalPaid 
      - memberBalances[uid].totalShare 
      + memberBalances[uid].totalDebtCredit 
      - memberBalances[uid].totalDebtOwed;
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

  const total = approvedExpenses.reduce((sum, exp) => sum + getExpenseTotalAmount(exp), 0);
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
 * @param {Array} expenses - Array of expenses (should only contain approved expenses)
 * @param {string} groupBy - 'day', 'week', 'month'
 * @returns {Array} Grouped expenses data
 */
export const groupExpensesByDate = (expenses, groupBy = 'day') => {
  // Only include approved expenses in charts
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
    grouped[key] += getExpenseTotalAmount(expense);
  });

  return Object.entries(grouped).map(([name, amount]) => ({
    name,
    amount: Math.round(amount * 100) / 100
  }));
};

