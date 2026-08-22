import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useActivity } from '../../context/ActivityContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import { ShoppingBag } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';

const RecurringExpenseForm = ({ expense = null, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const { logActivity } = useActivity();
  const [loading, setLoading] = useState(false);

  // Initialize form data
  const [formData, setFormData] = useState({
    name: expense?.name || '',
    amount: expense?.amount?.toString() || '',
    buyer: expense?.buyer || currentUser?.uid || '',
    sharedAmong: expense?.sharedAmong || [],
    frequency: expense?.frequency || 'monthly',
    nextDueDate: expense?.nextDueDate || new Date().toISOString().split('T')[0],
    status: expense?.status || 'active'
  });

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please provide a valid name and amount');
      return;
    }

    if (formData.sharedAmong.length === 0) {
      toast.error('Please select at least one person to share the expenses');
      return;
    }

    setLoading(true);

    try {
      const expenseData = {
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        buyer: formData.buyer,
        sharedAmong: formData.sharedAmong,
        frequency: formData.frequency,
        nextDueDate: formData.nextDueDate,
        status: formData.status
      };

      if (expense) {
        // Update existing
        const expenseRef = doc(db, 'households', household.id, 'recurringExpenses', expense.id);
        await updateDoc(expenseRef, {
          ...expenseData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
        toast.success(`Recurring expense updated successfully!`);
        await logActivity(
          'recurring_updated',
          `${currentUser?.displayName} updated the recurring expense: ${expenseData.name}`,
          { amount: expenseData.amount }
        );
      } else {
        // Create new
        const expensesRef = collection(db, 'households', household.id, 'recurringExpenses');
        await addDoc(expensesRef, {
          ...expenseData,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid
        });
        toast.success(`Recurring expense created successfully!`);
        
        await logActivity(
          'recurring_added', 
          `${currentUser?.displayName} created a new recurring expense: ${expenseData.name}`,
          { amount: expenseData.amount }
        );
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || `Failed to ${expense ? 'update' : 'create'} recurring expense`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      <div className="space-y-4">
        <Input
          label="Expense Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Netflix, Monthly Rent, Internet"
          icon={<ShoppingBag size={18} />}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Amount (৳)"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0.00"
            icon={<span className="text-primary font-bold">৳</span>}
            required
          />

          <Select
            label="Paid By (Buyer)"
            name="buyer"
            value={formData.buyer}
            onChange={handleChange}
            options={members.map(member => ({
              value: member.uid,
              label: getDisplayName(member)
            }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Frequency"
            name="frequency"
            value={formData.frequency}
            onChange={handleChange}
            options={frequencyOptions}
            required
          />

          <DatePicker
            label="Next Due Date"
            name="nextDueDate"
            value={formData.nextDueDate}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Shared Among
        </label>
        <div className="border border-input rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
          {members.map(member => (
            <label 
              key={member.uid} 
              className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors"
            >
              <input
                type="checkbox"
                value={member.uid}
                checked={formData.sharedAmong.includes(member.uid)}
                onChange={(e) => {
                  const uid = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    sharedAmong: e.target.checked
                      ? [...prev.sharedAmong, uid]
                      : prev.sharedAmong.filter(id => id !== uid)
                  }));
                }}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-2"
              />
              <span className="text-sm">{getDisplayName(member)}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Selected: {formData.sharedAmong.length} member(s)
        </p>
      </div>

      {expense && (
        <div className="space-y-2">
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused' }
            ]}
          />
          <p className="text-xs text-muted-foreground">
            Paused recurring expenses will not automatically generate new expenses.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Submitting...' : expense ? 'Update Recurring' : 'Create Recurring'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default RecurringExpenseForm;
