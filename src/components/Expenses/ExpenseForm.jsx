// Form component for adding new expenses
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Calendar, ShoppingBag } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';

const ExpenseForm = ({ onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    item: '',
    amount: '',
    buyer: currentUser?.uid || '',
    date: new Date().toISOString().split('T')[0],
    sharedAmong: [],
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSharedAmongChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData(prev => ({
      ...prev,
      sharedAmong: selected
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.item.trim()) {
      toast.error('Please enter item name');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (formData.sharedAmong.length === 0) {
      toast.error('Please select at least one person to share the expense');
      return;
    }

    setLoading(true);

    try {
      const expensesRef = collection(db, 'households', household.id, 'expenses');
      
      await addDoc(expensesRef, {
        item: formData.item.trim(),
        amount: parseFloat(formData.amount),
        buyer: formData.buyer,
        date: formData.date,
        sharedAmong: formData.sharedAmong,
        notes: formData.notes.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        approvedBy: null,
        approvedAt: null
      });

      toast.success('Expense submitted for approval!');
      
      // Reset form
      setFormData({
        item: '',
        amount: '',
        buyer: currentUser?.uid || '',
        date: new Date().toISOString().split('T')[0],
        sharedAmong: [],
        notes: ''
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <Input
        label="Item Name"
        name="item"
        value={formData.item}
        onChange={handleChange}
        placeholder="e.g., Groceries, Food etc."
        icon={<ShoppingBag size={18} />}
        required
      />

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
        label="Buyer"
        name="buyer"
        value={formData.buyer}
        onChange={handleChange}
        options={members.map(member => ({
          value: member.uid,
          label: getDisplayName(member)
        }))}
        required
      />

      <Input
        label="Date"
        name="date"
        type="date"
        value={formData.date}
        onChange={handleChange}
        icon={<Calendar size={18} />}
        required
      />

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

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Notes (Optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any additional notes..."
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Submitting...' : 'Submit Expense'}
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

export default ExpenseForm;

