// Recurring expense utilities
import { addDoc, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Frequency options for recurring expenses
 */
export const RECURRING_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly (Every 2 weeks)' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (Every 3 months)' },
  { value: 'yearly', label: 'Yearly' }
];

/**
 * Calculate next occurrence date
 */
export const calculateNextOccurrence = (lastDate, frequency) => {
  const date = new Date(lastDate);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      break;
  }

  return date.toISOString().split('T')[0];
};

/**
 * Check if recurring expense should be created
 */
export const shouldCreateRecurrence = (template) => {
  if (!template.isActive) return false;

  const now = new Date();
  const nextDate = new Date(template.nextOccurrence);
  
  return nextDate <= now;
};

/**
 * Create expense from recurring template
 */
export const createExpenseFromTemplate = async (householdId, template, createdBy) => {
  try {
    const expensesRef = collection(db, 'households', householdId, 'expenses');
    
    const expenseData = {
      items: template.items,
      totalAmount: template.totalAmount,
      date: template.nextOccurrence,
      sharedAmong: template.sharedAmong,
      notes: template.notes ? `${template.notes} (Auto-created from recurring template)` : 'Auto-created from recurring template',
      category: template.category,
      status: template.autoApprove ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      createdBy: createdBy,
      recurringTemplateId: template.id,
      approvedBy: template.autoApprove ? createdBy : null,
      approvedAt: template.autoApprove ? new Date().toISOString() : null
    };

    await addDoc(expensesRef, expenseData);

    // Update template with next occurrence
    const templateRef = doc(db, 'households', householdId, 'recurringTemplates', template.id);
    const nextOccurrence = calculateNextOccurrence(template.nextOccurrence, template.frequency);
    
    await updateDoc(templateRef, {
      lastCreated: new Date().toISOString(),
      nextOccurrence: nextOccurrence,
      timesCreated: (template.timesCreated || 0) + 1
    });

    return true;
  } catch (error) {
    console.error('Error creating recurring expense:', error);
    return false;
  }
};

/**
 * Process all recurring templates for a household
 */
export const processRecurringExpenses = async (householdId, templates, createdBy) => {
  const created = [];
  
  for (const template of templates) {
    if (shouldCreateRecurrence(template)) {
      const success = await createExpenseFromTemplate(householdId, template, createdBy);
      if (success) {
        created.push(template.name);
      }
    }
  }

  return created;
};

