// Budget management utilities
import { getCategoryById } from './categories';

/**
 * Calculate budget vs actual spending
 */
export const calculateBudgetStatus = (budgets, expenses, members) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter expenses for current month
  const monthlyExpenses = expenses.filter(expense => {
    if (expense.status !== 'approved') return false;
    const expenseDate = new Date(expense.date);
    return expenseDate.getMonth() === currentMonth && 
           expenseDate.getFullYear() === currentYear;
  });

  const budgetStatus = {};

  budgets.forEach(budget => {
    let totalSpent = 0;

    if (budget.type === 'category') {
      // Category budget
      monthlyExpenses.forEach(expense => {
        if (expense.items) {
          expense.items.forEach(item => {
            if (item.category === budget.categoryId) {
              totalSpent += parseFloat(item.amount || 0);
            }
          });
        } else if (expense.category === budget.categoryId) {
          totalSpent += parseFloat(expense.amount || 0);
        }
      });
    } else if (budget.type === 'member') {
      // Member budget
      monthlyExpenses.forEach(expense => {
        const sharePerPerson = expense.totalAmount / (expense.sharedAmong?.length || 1);
        if (expense.sharedAmong?.includes(budget.memberId)) {
          totalSpent += sharePerPerson;
        }
      });
    } else {
      // Overall household budget
      totalSpent = monthlyExpenses.reduce((sum, exp) => 
        sum + (parseFloat(exp.totalAmount) || parseFloat(exp.amount) || 0), 0
      );
    }

    const limit = parseFloat(budget.limit);
    const percentage = (totalSpent / limit) * 100;
    const remaining = limit - totalSpent;
    const status = percentage >= 100 ? 'exceeded' : 
                   percentage >= 80 ? 'warning' : 'good';

    budgetStatus[budget.id] = {
      ...budget,
      spent: Math.round(totalSpent * 100) / 100,
      limit,
      remaining: Math.round(remaining * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      status
    };
  });

  return budgetStatus;
};

/**
 * Check if budget alert should be triggered
 */
export const checkBudgetAlert = (budget, spent) => {
  const percentage = (spent / budget.limit) * 100;
  
  if (percentage >= 100 && !budget.alertSent100) {
    return {
      shouldAlert: true,
      level: 'exceeded',
      message: `Budget exceeded! You've spent ৳${spent} of ৳${budget.limit}`
    };
  } else if (percentage >= 80 && !budget.alertSent80) {
    return {
      shouldAlert: true,
      level: 'warning',
      message: `Budget warning: You've used ${Math.round(percentage)}% of your budget`
    };
  }

  return { shouldAlert: false };
};

/**
 * Get budget recommendations
 */
export const getBudgetRecommendations = (expenses, members) => {
  // Calculate average monthly spending for the last 3 months
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  
  const recentExpenses = expenses.filter(expense => {
    if (expense.status !== 'approved') return false;
    const expenseDate = new Date(expense.date);
    return expenseDate >= threeMonthsAgo;
  });

  const monthlyTotals = {};
  recentExpenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = 0;
    }
    monthlyTotals[monthKey] += parseFloat(expense.totalAmount || expense.amount || 0);
  });

  const values = Object.values(monthlyTotals);
  const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  
  return {
    recommendedMonthly: Math.ceil(average * 1.1), // 10% buffer
    averageSpending: Math.round(average),
    basedOnMonths: values.length
  };
};

