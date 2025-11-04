// Utility functions for automatically generating debts from expenses
import { collection, doc, setDoc, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { roundUpSharedAmount, roundDebtToNearestTen } from './calculations';

/**
 * Calculate automatic debts from approved expenses
 * Consolidates amounts owed between same people
 * @param {Array} expenses - Array of approved expenses
 * @param {Array} members - Array of household members
 * @returns {Array} Array of consolidated debt objects
 */
export const calculateAutomaticDebts = (expenses, members) => {
  // Filter only approved expenses
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
  
  // Create a map to track net amounts owed between members
  // Key: "debtor_uid:creditor_uid", Value: amount
  const debtMap = {};
  
  approvedExpenses.forEach(expense => {
    const sharedAmong = expense.sharedAmong || [];
    
    if (sharedAmong.length === 0) return;
    
    // Support both old format (single item) and new format (multiple items)
    if (expense.items && Array.isArray(expense.items) && expense.items.length > 0) {
      // New format: Multiple items, each with its own buyer and amount
      expense.items.forEach(item => {
        const itemAmount = parseFloat(item.amount) || 0;
        const buyer = item.buyer;
        
                if (itemAmount <= 0 || !buyer) return;

        // Use rounded up share per person
        const shareCalc = roundUpSharedAmount(itemAmount, sharedAmong.length);
        const sharePerPerson = shareCalc.rounded;

        // Each person in sharedAmong owes the buyer their share of this item
        sharedAmong.forEach(memberId => {
          // Skip if the buyer is also sharing (they don't owe themselves)
          if (memberId === buyer) return;

          const debtKey = `${memberId}:${buyer}`;

          if (!debtMap[debtKey]) {
            debtMap[debtKey] = 0;
          }

          debtMap[debtKey] += sharePerPerson;
        });
      });
    } else {
      // Old format: Single item with expense.amount and expense.buyer
      const amount = parseFloat(expense.amount) || 0;
      const buyer = expense.buyer;
      
            if (amount <= 0 || !buyer) return;

      // Use rounded up share per person
      const shareCalc = roundUpSharedAmount(amount, sharedAmong.length);
      const sharePerPerson = shareCalc.rounded;

      // Each person in sharedAmong owes the buyer their share
      sharedAmong.forEach(memberId => {
        // Skip if the buyer is also sharing (they don't owe themselves)
        if (memberId === buyer) return;

        const debtKey = `${memberId}:${buyer}`;

        if (!debtMap[debtKey]) {
          debtMap[debtKey] = 0;
        }

        debtMap[debtKey] += sharePerPerson;
      });
    }
  });
  
  // Convert debt map to array of debt objects
  const automaticDebts = [];
  
    Object.entries(debtMap).forEach(([key, amount]) => {
    if (amount > 0.01) { // Only include debts over 1 cent
      const [debtor, creditor] = key.split(':');

      // Round debt amount to nearest 10
      const debtRounding = roundDebtToNearestTen(amount);

      automaticDebts.push({
        debtor,
        creditor,
        amount: debtRounding.rounded, // Rounded to nearest 10
        originalAmount: amount, // Keep original for calculation display
        type: 'auto',
        calculation: debtRounding.calculation
      });
    }
  });
  
  return automaticDebts;
};

/**
 * Sync automatic debts to Firestore
 * Creates/updates automatic debt records based on expenses
 * @param {string} householdId - Household ID
 * @param {Array} automaticDebts - Array of automatic debt objects
 * @param {Array} existingDebts - Current debt records from Firestore
 */
export const syncAutomaticDebts = async (householdId, automaticDebts, existingDebts) => {
  try {
    const debtsRef = collection(db, 'households', householdId, 'debts');
    const batch = writeBatch(db);
    
    // Filter existing auto debts
    const existingAutoDebts = existingDebts.filter(debt => debt.type === 'auto');
    
    // Create a map of existing auto debts for quick lookup
    const existingAutoDebtMap = {};
    existingAutoDebts.forEach(debt => {
      const key = `${debt.debtor}:${debt.creditor}`;
      existingAutoDebtMap[key] = debt;
    });
    
    // Track which debts we've processed
    const processedKeys = new Set();
    
    // Update or create automatic debts
    for (const autoDebt of automaticDebts) {
      const key = `${autoDebt.debtor}:${autoDebt.creditor}`;
      processedKeys.add(key);
      
      const existingDebt = existingAutoDebtMap[key];
      
      if (existingDebt) {
        // Update existing auto debt if amount changed
        if (Math.abs(existingDebt.remainingAmount - autoDebt.amount) > 0.01) {
          const debtDocRef = doc(debtsRef, existingDebt.id);
          batch.update(debtDocRef, {
            originalAmount: autoDebt.amount,
            remainingAmount: autoDebt.amount,
            updatedAt: new Date().toISOString()
          });
        }
      } else {
        // Create new auto debt
        const newDebtRef = doc(debtsRef);
        batch.set(newDebtRef, {
          debtor: autoDebt.debtor,
          creditor: autoDebt.creditor,
          originalAmount: autoDebt.amount,
          remainingAmount: autoDebt.amount,
          reason: 'Shared expenses',
          date: new Date().toISOString().split('T')[0],
          notes: 'Automatically generated from shared expenses',
          status: 'approved', // Auto debts are automatically approved
          type: 'auto',
          payments: [],
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          approvedBy: 'system',
          approvedAt: new Date().toISOString(),
          paidAt: null
        });
      }
    }
    
    // Delete auto debts that no longer exist (amount became 0 or expenses changed)
    for (const existingDebt of existingAutoDebts) {
      const key = `${existingDebt.debtor}:${existingDebt.creditor}`;
      if (!processedKeys.has(key)) {
        const debtDocRef = doc(debtsRef, existingDebt.id);
        batch.delete(debtDocRef);
      }
    }
    
    // Commit all changes
    await batch.commit();
  } catch (error) {
    throw error;
  }
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
    // Calculate what automatic debts should exist
    const automaticDebts = calculateAutomaticDebts(expenses, members);
    
    // Sync with Firestore
    await syncAutomaticDebts(householdId, automaticDebts, existingDebts);
  } catch (error) {
    throw error;
  }
};

