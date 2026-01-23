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

/**
 * Calculate Pairwise Debts from Expenses
 * This determines who owes whom based on direct interactions in expenses.
 * It does NOT simplify transitively (A->B->C != A->C), preserving social relationships.
 * 
 * @param {Array} expenses - List of approved expenses
 * @param {Array} members - List of members
 * @returns {Array} List of debt objects { from, to, amount, expenseIds }
 */
export const calculatePairwiseDebts = (expenses, members) => {
  // Map to store net flow between pairs: "uid1_uid2" -> amount (positive means uid1 owes uid2)
  // We always store with key where uid1 < uid2 alphabetically to handle direction
  const pairBalances = {};
  const pairExpenses = {}; // "uid1_uid2" -> Set of expense IDs

  const getPairKey = (id1, id2) => {
    if (id1 < id2) return `${id1}_${id2}`;
    return `${id2}_${id1}`;
  };

  const updateBalance = (debtor, creditor, amount, expenseId) => {
    if (debtor === creditor) return; // You can't owe yourself

    const key = getPairKey(debtor, creditor);
    if (!pairBalances[key]) pairBalances[key] = 0;
    if (!pairExpenses[key]) pairExpenses[key] = new Set();

    // If key is "A_B" and debtor is A, creditor is B: A owes B.
    // We define positive value as "First ID owes Second ID"
    // If debtor < creditor (matches key order): Add to balance
    // If debtor > creditor (inverse key order): Subtract from balance
    if (debtor < creditor) {
      pairBalances[key] += amount;
    } else {
      pairBalances[key] -= amount;
    }

    pairExpenses[key].add(expenseId);
  };

  // Process each expense
  expenses.forEach(expense => {
    if (expense.status !== 'approved') return;

    const items = expense.items || [{ name: expense.item, amount: expense.amount, buyer: expense.buyer }];

    items.forEach(item => {
      const buyer = item.buyer;
      const amount = parseFloat(item.amount) || 0;
      const sharedAmong = expense.sharedAmong || [];

      if (!buyer || !amount || sharedAmong.length === 0) return;

      // Calculate share per person
      const { rounded: shareAmount } = roundUpSharedAmount(amount, sharedAmong.length);

      // Each person in sharedAmong owes the buyer their share
      sharedAmong.forEach(consumer => {
        if (consumer !== buyer) {
          updateBalance(consumer, buyer, shareAmount, expense.id);
        }
      });
    });
  });

  // Convert pair balances to debt objects
  const debts = [];
  Object.entries(pairBalances).forEach(([key, netAmount]) => {
    const [id1, id2] = key.split('_');
    const expenseIds = Array.from(pairExpenses[key] || []);

    if (Math.abs(netAmount) > 0.01) {
      if (netAmount > 0) {
        // id1 owes id2
        debts.push({
          from: id1,
          to: id2,
          amount: parseFloat(netAmount.toFixed(2)),
          expenseIds
        });
      } else {
        // id2 owes id1 (negative balance)
        debts.push({
          from: id2,
          to: id1,
          amount: parseFloat(Math.abs(netAmount).toFixed(2)),
          expenseIds
        });
      }
    }
  });

  return debts;
};

/**
 * Calculate balance summary for all household members
 * Uses the pairwise debts to determine net positions.
 * @param {Array} expenses - Array of approved expenses
 * @param {Array} members - Array of household members
 * @param {Array} manualDebts - Array of manual debts (optional)
 * @returns {Object} Balance summary with totals and individual balances
 */
export const calculateBalances = (expenses, members, providedDebts = []) => {
  let allDebts = [];

  // Check if providedDebts contains auto debts (indicating it's the full list from Firestore)
  const hasAutoDebts = providedDebts.some(d => d.type === 'auto');

  if (hasAutoDebts) {
    // Use providedDebts as the single source of truth
    allDebts = providedDebts
      .filter(d => d.status === 'approved')
      .map(d => ({
        from: d.debtor, // Firestore uses debtor/creditor
        to: d.creditor,
        amount: parseFloat(d.originalAmount || d.amount || 0),
        payments: d.payments || [],
        type: d.type || 'manual', // Preserve type
        expenseIds: d.expenseIds || []
      }));
  } else {
    // Legacy/Fallback: Calculate auto debts from expenses + manual debts
    // 1. Get Auto Debts from expenses
    const autoDebts = calculatePairwiseDebts(expenses, members);

    // 2. Combine with Manual Debts (only approved ones)
    allDebts = [
      ...autoDebts.map(d => ({ ...d, type: 'auto' })),
      ...providedDebts.filter(d => d.status === 'approved').map(d => ({
        from: d.debtor,
        to: d.creditor,
        amount: parseFloat(d.originalAmount || d.amount || 0),
        payments: d.payments || [],
        type: 'manual'
      }))
    ];
  }

  // Initialize member balances
  const memberBalances = {};
  members.forEach(member => {
    memberBalances[member.uid] = {
      name: getDisplayName(member),
      photoURL: member.photoURL,
      totalPaid: 0, // Total spent on expenses
      totalShare: 0, // Total value consumed
      totalDebtOwed: 0, // Net amount I owe
      totalDebtCredit: 0, // Net amount owed to me
      balance: 0
    };
  });

  // Calculate Total Paid and Total Share (Consumption) from expenses
  // This is for statistics, not for debt calculation (which is done pairwise above)
  expenses.forEach(expense => {
    if (expense.status !== 'approved') return;

    const items = expense.items || [{ amount: expense.amount, buyer: expense.buyer }];
    items.forEach(item => {
      const amt = parseFloat(item.amount) || 0;
      if (memberBalances[item.buyer]) {
        memberBalances[item.buyer].totalPaid += amt;
      }

      const sharedAmong = expense.sharedAmong || [];
      if (sharedAmong.length > 0) {
        const { rounded: share } = roundUpSharedAmount(amt, sharedAmong.length);
        sharedAmong.forEach(uid => {
          if (memberBalances[uid]) {
            memberBalances[uid].totalShare += share;
          }
        });
      }
    });
  });

  // Calculate Net Debts considering Payments
  // We need to track the *remaining* amount for each debt
  allDebts.forEach(debt => {
    let remaining = debt.amount;

    // Subtract payments if any (Manual debts usually have payments array)
    // Auto debts in this calculation are "fresh" from expenses, so they don't have payments attached yet
    // UNLESS we passed in existing auto debts, but here we recalculated them from scratch.
    // The `manualDebts` passed in might have payments.
    if (debt.payments && Array.isArray(debt.payments)) {
      const paid = debt.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      remaining = Math.max(0, remaining - paid);
    }

    if (remaining > 0.01) {
      if (memberBalances[debt.from]) {
        memberBalances[debt.from].totalDebtOwed += remaining;
      }
      if (memberBalances[debt.to]) {
        memberBalances[debt.to].totalDebtCredit += remaining;
      }
    }
  });

  // Final Balance
  Object.values(memberBalances).forEach(mb => {
    mb.balance = mb.totalDebtCredit - mb.totalDebtOwed;
  });

  return {
    memberBalances,
    grandTotal: Object.values(memberBalances).reduce((sum, m) => sum + m.totalPaid, 0)
  };
};

// Legacy export for compatibility if needed, but calculatePairwiseDebts is preferred
export const calculateDebts = (memberBalances) => {
  // This is no longer used by the new logic but kept to avoid breaking imports
  // It returns empty array as we don't use net-balance simplification anymore
  return [];
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
