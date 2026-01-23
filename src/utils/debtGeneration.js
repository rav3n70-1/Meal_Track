// Utility functions for automatically generating debts from expenses
import { collection, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { calculatePairwiseDebts } from './calculations';

/**
 * Calculate automatic debts from approved expenses
 * Consolidates amounts owed between same people
 * @param {Array} expenses - Array of expenses
 * @param {Array} members - Array of household members
 * @returns {Array} Calculated debt objects
 */
const calculateAutomaticDebts = (expenses, members) => {
  // 1. Calculate pairwise debts directly from expenses
  // This returns debts with { from, to, amount, expenseIds }
  const debts = calculatePairwiseDebts(expenses, members);

  console.log('[Debug] calculateAutomaticDebts result:', debts.length, 'debts');

  // 2. Format as debt objects
  return debts.map(d => ({
    from: d.from,
    to: d.to,
    amount: d.amount,
    expenseIds: d.expenseIds, // Store contributing expenses
    type: 'auto',
    status: 'approved', // Auto debts are always approved
    date: new Date().toISOString()
  }));
};

/**
 * Generate and sync automatic debts
 * Main function to call when expenses change
 * @param {string} householdId - Household ID
 * @param {Array} expenses - Array of expenses
 * @param {Array} members - Array of household members
 * @param {Array} existingDebts - Current debt records
 */
export const updateAutomaticDebts = async (householdId, expenses, members, existingDebts) => {
  try {
    // Calculate what automatic debts should exist based on current expenses
    const targetDebts = calculateAutomaticDebts(expenses, members);

    // Filter existing debts to only include auto debts
    const existingAutoDebts = existingDebts.filter(d => d.type === 'auto');

    const batch = writeBatch(db);
    const debtsRef = collection(db, 'households', householdId, 'debts');

    // Track which existing debts have been handled
    const handledDebtIds = new Set();

    // 1. Update or Create debts based on target
    targetDebts.forEach(target => {
      // Find matching existing debt (same debtor and creditor)
      const existing = existingAutoDebts.find(d =>
        d.debtor === target.from &&
        d.creditor === target.to
      );

      if (existing) {
        handledDebtIds.add(existing.id);

        // Calculate new remaining amount
        // Start with new total amount
        let newRemaining = target.amount;

        // Subtract all valid payments made on this debt
        if (existing.payments && Array.isArray(existing.payments)) {
          const totalPaid = existing.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
          newRemaining = Math.max(0, target.amount - totalPaid);
        }

        // If amount changed or remaining amount needs update
        if (Math.abs(existing.amount - target.amount) > 0.01 ||
          Math.abs(existing.remainingAmount - newRemaining) > 0.01) {

          const debtDoc = doc(debtsRef, existing.id);
          batch.update(debtDoc, {
            amount: target.amount,
            remainingAmount: newRemaining,
            expenseIds: target.expenseIds || [], // Update contributing expenses
            updatedAt: new Date().toISOString(),
            // If it was fully paid but now has more debt, set back to approved
            status: newRemaining > 0.01 ? 'approved' : 'paid'
          });
        }
      } else {
        // Create new debt
        const newDebtRef = doc(debtsRef);
        batch.set(newDebtRef, {
          debtor: target.from,
          creditor: target.to,
          amount: target.amount,
          originalAmount: target.amount,
          remainingAmount: target.amount,
          expenseIds: target.expenseIds || [], // Save contributing expenses
          type: 'auto',
          status: 'approved',
          date: target.date,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          payments: []
        });
      }
    });

    // 2. Handle Orphans (existing auto debts that are no longer needed)
    existingAutoDebts.forEach(existing => {
      if (!handledDebtIds.has(existing.id)) {
        const debtDoc = doc(debtsRef, existing.id);

        // If it has payments, we can't just delete it
        // Instead, set amount equal to what was paid (so remaining is 0)
        if (existing.payments && existing.payments.length > 0) {
          const totalPaid = existing.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

          // Only update if not already settled
          if (Math.abs(existing.amount - totalPaid) > 0.01 || existing.remainingAmount > 0.01) {
            batch.update(debtDoc, {
              amount: totalPaid,
              remainingAmount: 0,
              status: 'paid',
              updatedAt: new Date().toISOString(),
              note: 'Auto-adjusted: Expenses changed, debt reduced to paid amount'
            });
          }
        } else {
          // No payments, safe to delete
          batch.delete(debtDoc);
        }
      }
    });

    await batch.commit();

  } catch (error) {
    console.error('Error syncing automatic debts:', error);
    throw error;
  }
};

