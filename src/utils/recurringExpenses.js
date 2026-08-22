import { 
  collection, 
  query, 
  where, 
  getDocs, 
  runTransaction, 
  doc, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { addDays, addWeeks, addMonths, addYears, format, isBefore, isSameDay } from 'date-fns';

/**
 * Calculates the next due date based on the current due date and frequency
 * @param {string} currentDateStr - ISO date string (YYYY-MM-DD)
 * @param {string} frequency - 'daily', 'weekly', 'monthly', 'yearly'
 * @returns {string} - New ISO date string
 */
export const calculateNextDueDate = (currentDateStr, frequency) => {
  const currentDate = new Date(currentDateStr);
  let nextDate;

  switch (frequency) {
    case 'daily':
      nextDate = addDays(currentDate, 1);
      break;
    case 'weekly':
      nextDate = addWeeks(currentDate, 1);
      break;
    case 'monthly':
      nextDate = addMonths(currentDate, 1);
      break;
    case 'yearly':
      nextDate = addYears(currentDate, 1);
      break;
    default:
      nextDate = addMonths(currentDate, 1);
  }

  return format(nextDate, 'yyyy-MM-dd');
};

/**
 * Checks and processes any due recurring expenses for a household.
 * Uses Firestore Transactions to ensure thread-safety if multiple users log in simultaneously.
 * 
 * @param {string} householdId 
 * @param {object} currentUser - The currently logged-in user triggering the check
 */
export const processDueRecurringExpenses = async (householdId, currentUser) => {
  if (!householdId || !currentUser) return;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayDate = new Date(todayStr);

  try {
    // 1. Query for active recurring expenses that are due today or in the past
    const recurringRef = collection(db, 'households', householdId, 'recurringExpenses');
    const q = query(recurringRef, where('status', '==', 'active'));
    
    // Note: We fetch all active ones and filter in memory because Firestore inequality filters 
    // (<=) on string dates can be tricky with composite indexes. It's safer for small datasets.
    const snapshot = await getDocs(q);
    
    const dueExpenses = snapshot.docs.filter(docSnap => {
      const data = docSnap.data();
      const dueDate = new Date(data.nextDueDate);
      // is due if dueDate is before today OR is the exact same day
      return isBefore(dueDate, todayDate) || isSameDay(dueDate, todayDate);
    });

    if (dueExpenses.length === 0) return; // Nothing to process

    console.log(`[Recurring Engine] Found ${dueExpenses.length} due recurring expenses.`);

    // 2. Process each due expense using a transaction to prevent race conditions
    for (const docSnap of dueExpenses) {
      const recurringId = docSnap.id;
      const recurringDocRef = doc(db, 'households', householdId, 'recurringExpenses', recurringId);
      
      await runTransaction(db, async (transaction) => {
        // Read the recurring expense inside the transaction to ensure we have the latest state
        const sfDoc = await transaction.get(recurringDocRef);
        
        if (!sfDoc.exists()) return; // Was deleted
        
        const data = sfDoc.data();
        const currentDueDate = new Date(data.nextDueDate);
        
        // Double check it's still due (another user's client might have just processed it)
        if (data.status !== 'active' || (!isBefore(currentDueDate, todayDate) && !isSameDay(currentDueDate, todayDate))) {
          console.log(`[Recurring Engine] Skipped ${recurringId} as it was already processed.`);
          return;
        }

        // --- Execute the generation ---

        // 1. Calculate the next due date
        const nextDueDate = calculateNextDueDate(data.nextDueDate, data.frequency);

        // 2. Create the new one-off expense in the expenses collection
        const newExpenseRef = doc(collection(db, 'households', householdId, 'expenses'));
        
        const newExpenseData = {
          items: [{
            name: `${data.name} (${data.frequency} charge)`,
            amount: data.amount,
            buyer: data.buyer
          }],
          totalAmount: data.amount,
          date: data.nextDueDate, // Log it for the date it was actually due
          sharedAmong: data.sharedAmong,
          notes: `Automatically generated from recurring expense: ${data.name}`,
          status: 'pending', // Requires manager approval just like normal expenses
          createdAt: new Date().toISOString(),
          createdBy: 'system',
          approvedBy: null,
          approvedAt: null,
          recurringExpenseId: recurringId
        };

        transaction.set(newExpenseRef, newExpenseData);

        // 3. Update the next due date on the recurring expense
        transaction.update(recurringDocRef, { 
          nextDueDate,
          lastProcessedAt: new Date().toISOString()
        });

        // 4. Log the activity
        const activityRef = doc(collection(db, 'households', householdId, 'activities'));
        transaction.set(activityRef, {
          type: 'recurring_processed',
          description: `System generated recurring expense: ${data.name}`,
          metadata: { amount: data.amount, recurringId },
          actorUid: 'system',
          actorName: 'System',
          timestamp: new Date().toISOString()
        });
        
      });
    }

    // --- Part 2: Process Recurring Rent & Bills ---
    const recurringRentBillsRef = collection(db, 'households', householdId, 'recurringRentBills');
    const qRent = query(recurringRentBillsRef, where('status', '==', 'active'));
    const snapshotRent = await getDocs(qRent);
    
    const dueRentBills = snapshotRent.docs.filter(docSnap => {
      const data = docSnap.data();
      const dueDate = new Date(data.nextDueDate);
      return isBefore(dueDate, todayDate) || isSameDay(dueDate, todayDate);
    });

    if (dueRentBills.length > 0) {
      console.log(`[Recurring Engine] Found ${dueRentBills.length} due recurring rent/bills.`);

      for (const docSnap of dueRentBills) {
        const recurringId = docSnap.id;
        const recurringDocRef = doc(db, 'households', householdId, 'recurringRentBills', recurringId);
        
        await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(recurringDocRef);
          if (!sfDoc.exists()) return;
          
          const data = sfDoc.data();
          const currentDueDate = new Date(data.nextDueDate);
          
          if (data.status !== 'active' || (!isBefore(currentDueDate, todayDate) && !isSameDay(currentDueDate, todayDate))) {
            return;
          }

          const nextDueDate = calculateNextDueDate(data.nextDueDate, data.frequency);

          // Create the new rent bill
          const newRentBillRef = doc(collection(db, 'households', householdId, 'rentBills'));
          
          const newRentBillData = {
            totalAmount: data.totalAmount,
            dueDate: data.nextDueDate,
            description: `${data.description} (${data.frequency} charge)`,
            notes: `Automatically generated from recurring bill: ${data.description}`,
            categories: data.categories || [],
            memberCategoryAmounts: data.memberCategoryAmounts || {},
            createdBy: 'system',
            createdByName: 'System',
            status: 'unpaid',
            paidAmount: 0,
            memberBreakdown: data.memberBreakdown || [],
            recurringBillId: recurringId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          transaction.set(newRentBillRef, newRentBillData);

          // Update recurring next due date
          transaction.update(recurringDocRef, { 
            nextDueDate,
            lastProcessedAt: new Date().toISOString()
          });

          // Log the activity
          const activityRef = doc(collection(db, 'households', householdId, 'activities'));
          transaction.set(activityRef, {
            type: 'recurring_rentbill_processed',
            description: `System generated recurring rent/bill: ${data.description}`,
            metadata: { amount: data.totalAmount, recurringId },
            actorUid: 'system',
            actorName: 'System',
            timestamp: new Date().toISOString()
          });
        });
      }
    }

  } catch (error) {
    console.error('[Recurring Engine] Error processing recurring expenses/bills:', error);
  }
};
