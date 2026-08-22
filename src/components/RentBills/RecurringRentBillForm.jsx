import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DatePicker from '../ui/DatePicker';
import Select from '../ui/Select';
import { useRentBills } from '../../context/RentBillsContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';

const RecurringRentBillForm = ({ bill = null, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const { rentBillMembers } = useRentBills();
  const [loading, setLoading] = useState(false);

  // Combine household members and rent-only members
  const allMembers = [
    ...members.map(m => ({ ...m, isRentOnly: false })),
    ...rentBillMembers.map(m => ({ ...m, isRentOnly: true }))
  ];

  // Default categories
  const defaultCategories = ['Flat rent', 'Electricity', 'Housekeeper', 'Wifi'];

  const [categories, setCategories] = useState(defaultCategories);
  const [memberCategoryAmounts, setMemberCategoryAmounts] = useState({});

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  const [formData, setFormData] = useState({
    description: bill?.description || '',
    notes: bill?.notes || '',
    frequency: bill?.frequency || 'monthly',
    nextDueDate: bill?.nextDueDate || new Date().toISOString().split('T')[0],
    status: bill?.status || 'active'
  });

  // Initialize form data
  useEffect(() => {
    if (bill && bill.categories && bill.memberCategoryAmounts) {
      setCategories(bill.categories);
      setMemberCategoryAmounts(bill.memberCategoryAmounts);
    } else if (!bill) {
      const initialAmounts = {};
      allMembers.forEach(member => {
        initialAmounts[member.uid] = {};
        defaultCategories.forEach(category => {
          initialAmounts[member.uid][category] = '';
        });
      });
      setMemberCategoryAmounts(initialAmounts);
    }
  }, [bill, allMembers.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateMemberTotal = (memberId) => {
    if (!memberCategoryAmounts[memberId]) return 0;
    return Object.values(memberCategoryAmounts[memberId]).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
  };

  const calculateCategoryTotal = (category) => {
    return allMembers.reduce((sum, member) => {
      const amount = memberCategoryAmounts[member.uid]?.[category] || 0;
      return sum + (parseFloat(amount) || 0);
    }, 0);
  };

  const calculateBillTotal = () => {
    return categories.reduce((sum, category) => sum + calculateCategoryTotal(category), 0);
  };

  const billTotal = calculateBillTotal();

  const handleMemberCategoryAmountChange = (memberId, category, amount) => {
    setMemberCategoryAmounts(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [category]: amount
      }
    }));
  };

  const handleAddCategory = () => {
    const newCategory = prompt('Enter category name:');
    if (newCategory && newCategory.trim()) {
      const trimmedCategory = newCategory.trim();
      if (categories.includes(trimmedCategory)) {
        toast.error('This category already exists');
        return;
      }
      setCategories([...categories, trimmedCategory]);
      const newAmounts = { ...memberCategoryAmounts };
      allMembers.forEach(member => {
        if (!newAmounts[member.uid]) newAmounts[member.uid] = {};
        newAmounts[member.uid][trimmedCategory] = '';
      });
      setMemberCategoryAmounts(newAmounts);
    }
  };

  const handleRemoveCategory = (category) => {
    if (categories.length <= 1) {
      toast.error('You must have at least one category');
      return;
    }
    setCategories(categories.filter(cat => cat !== category));
    const newAmounts = { ...memberCategoryAmounts };
    allMembers.forEach(member => {
      if (newAmounts[member.uid]) delete newAmounts[member.uid][category];
    });
    setMemberCategoryAmounts(newAmounts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nextDueDate) {
      toast.error('Please select a next due date');
      return;
    }
    if (categories.length === 0) {
      toast.error('Please add at least one category');
      return;
    }

    setLoading(true);

    try {
      const billData = {
        totalAmount: billTotal,
        description: formData.description,
        notes: formData.notes,
        frequency: formData.frequency,
        nextDueDate: formData.nextDueDate,
        status: formData.status,
        categories: categories,
        memberCategoryAmounts: memberCategoryAmounts,
        memberBreakdown: allMembers.map(member => ({
          memberId: member.uid,
          memberName: getDisplayName(member),
          amount: calculateMemberTotal(member.uid)
        }))
      };

      if (bill) {
        // Update existing
        const billRef = doc(db, 'households', household.id, 'recurringRentBills', bill.id);
        await updateDoc(billRef, {
          ...billData,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.uid
        });
        toast.success('Recurring bill updated successfully');
      } else {
        // Create new
        const billsRef = collection(db, 'households', household.id, 'recurringRentBills');
        await addDoc(billsRef, {
          ...billData,
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid
        });
        toast.success('Recurring bill created successfully');
      }

      onSuccess?.();
    } catch (error) {
      toast.error(error.message || 'Failed to save recurring bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Input
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="e.g., Monthly Rent & Utilities"
        required
      />

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

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Total Bill Amount</label>
        <input
          type="text"
          value={`৳${billTotal.toFixed(2)}`}
          disabled
          readOnly
          className="w-full px-4 py-2 rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed font-semibold"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium leading-none">Member Amounts by Category</label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddCategory}
            icon={<Plus size={16} />}
          >
            Add Category
          </Button>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-accent">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold border-r border-border">Member</th>
                  {categories.map((category) => (
                    <th key={category} className="px-4 py-3 text-left text-sm font-semibold border-r border-border relative group">
                      <div className="flex items-center gap-2">
                        {category}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-sm font-semibold bg-primary/10">Total</th>
                </tr>
              </thead>
              <tbody>
                {allMembers.map((member, memberIdx) => (
                  <tr key={member.uid} className={`border-t border-border ${memberIdx % 2 === 0 ? 'bg-background' : 'bg-accent/30'}`}>
                    <td className="px-4 py-3 border-r border-border font-medium">
                      <div className="flex items-center gap-2">
                        {getDisplayName(member)}
                        {member.isRentOnly && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Rent Only</span>
                        )}
                      </div>
                    </td>
                    {categories.map((category) => (
                      <td key={category} className="px-4 py-3 border-r border-border">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={memberCategoryAmounts[member.uid]?.[category] || ''}
                          onChange={(e) => handleMemberCategoryAmountChange(member.uid, category, e.target.value)}
                          className="w-full px-2 py-1 rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="0.00"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 bg-primary/10 font-semibold">
                      ৳{calculateMemberTotal(member.uid).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-accent border-t-2 border-primary">
                <tr>
                  <td className="px-4 py-3 font-bold border-r border-border">Category Total</td>
                  {categories.map((category) => (
                    <td key={category} className="px-4 py-3 font-bold border-r border-border text-primary">
                      ৳{calculateCategoryTotal(category).toFixed(2)}
                    </td>
                  ))}
                  <td className="px-4 py-3 font-bold bg-primary/20 text-primary">
                    ৳{billTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Notes (Optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Add any additional notes..."
          className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {bill && (
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
            Paused recurring bills will not automatically generate new bills.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Saving...' : bill ? 'Update Recurring Bill' : 'Create Recurring Bill'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </motion.form>
  );
};

export default RecurringRentBillForm;
