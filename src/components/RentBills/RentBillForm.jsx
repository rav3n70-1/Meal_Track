// Form for creating/editing Rent and Bills with category-based tracking
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import DatePicker from '../ui/DatePicker';
import { useRentBills } from '../../context/RentBillsContext';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/displayName';
import toast from 'react-hot-toast';

const RentBillForm = ({ bill = null, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { members, getUserRole } = useHousehold();
  const { rentBillMembers, createRentBill, updateRentBill } = useRentBills();
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

  // Initialize form data
  useEffect(() => {
    if (bill && bill.categories && bill.memberCategoryAmounts) {
      // Load existing bill data
      setCategories(bill.categories);
      setMemberCategoryAmounts(bill.memberCategoryAmounts);
    } else if (!bill) {
      // Initialize empty amounts for new bill
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

  const [formData, setFormData] = useState({
    totalAmount: bill?.totalAmount || '',
    dueDate: bill?.dueDate || new Date().toISOString().split('T')[0],
    description: bill?.description || '',
    notes: bill?.notes || ''
  });

  // Calculate total for each member across all categories
  const calculateMemberTotal = (memberId) => {
    if (!memberCategoryAmounts[memberId]) return 0;
    return Object.values(memberCategoryAmounts[memberId]).reduce((sum, amt) => {
      return sum + (parseFloat(amt) || 0);
    }, 0);
  };

  // Calculate total for a category across all members
  const calculateCategoryTotal = (category) => {
    return allMembers.reduce((sum, member) => {
      const amount = memberCategoryAmounts[member.uid]?.[category] || 0;
      return sum + (parseFloat(amount) || 0);
    }, 0);
  };

  // Calculate total bill amount (sum of all category totals)
  const calculateBillTotal = () => {
    return categories.reduce((sum, category) => {
      return sum + calculateCategoryTotal(category);
    }, 0);
  };

  const billTotal = calculateBillTotal();

  // Handle member amount change for a specific category
  const handleMemberCategoryAmountChange = (memberId, category, amount) => {
    setMemberCategoryAmounts(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [category]: amount
      }
    }));
  };

  // Add new category
  const handleAddCategory = () => {
    const newCategory = prompt('Enter category name:');
    if (newCategory && newCategory.trim()) {
      const trimmedCategory = newCategory.trim();
      if (categories.includes(trimmedCategory)) {
        toast.error('This category already exists');
        return;
      }
      setCategories([...categories, trimmedCategory]);
      // Add empty amounts for new category to all members
      const newAmounts = { ...memberCategoryAmounts };
      allMembers.forEach(member => {
        if (!newAmounts[member.uid]) {
          newAmounts[member.uid] = {};
        }
        newAmounts[member.uid][trimmedCategory] = '';
      });
      setMemberCategoryAmounts(newAmounts);
    }
  };

  // Remove category
  const handleRemoveCategory = (category) => {
    if (categories.length <= 1) {
      toast.error('You must have at least one category');
      return;
    }
    setCategories(categories.filter(cat => cat !== category));
    // Remove this category from all members
    const newAmounts = { ...memberCategoryAmounts };
    allMembers.forEach(member => {
      if (newAmounts[member.uid]) {
        delete newAmounts[member.uid][category];
      }
    });
    setMemberCategoryAmounts(newAmounts);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.dueDate) {
      toast.error('Please select a due date');
      return;
    }

    if (categories.length === 0) {
      toast.error('Please add at least one category');
      return;
    }

    // Allow managers to set total amount independently; we won't block mismatch

    setLoading(true);

    try {
      const billData = {
        totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : billTotal,
        dueDate: formData.dueDate,
        description: formData.description,
        notes: formData.notes,
        categories: categories,
        memberCategoryAmounts: memberCategoryAmounts,
        createdBy: currentUser.uid,
        createdByName: getDisplayName(currentUser),
        // Add status and paidAmount fields
        status: (bill && bill.status) || 'unpaid',
        paidAmount: (bill && bill.paidAmount) || 0,
        // Legacy support - calculate member breakdown
        memberBreakdown: allMembers.map(member => ({
          memberId: member.uid,
          memberName: getDisplayName(member),
          amount: calculateMemberTotal(member.uid)
        }))
      };

      if (bill) {
        // Update existing bill
        await updateRentBill(bill.id, billData);
        toast.success('Bill updated successfully');
      } else {
        // Create new bill
        await createRentBill(billData);
        toast.success('Bill created successfully');
      }

      onSuccess?.();
    } catch (error) {
      toast.error(error.message || 'Failed to save bill');
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
      {/* Description */}
      <Input
        label="Description"
        type="text"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="e.g., January 2024 Rent"
        required
      />

      {/* Due Date */}
      <DatePicker
        label="Due Date"
        value={formData.dueDate}
        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        required
      />

      {/* Total Bill Amount - Read-only display */}
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

      {/* Created By (Read-only) */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Created By</label>
        <input
          type="text"
          value={getDisplayName(currentUser)}
          disabled
          readOnly
          className="w-full px-4 py-2 rounded-lg border border-input bg-muted text-muted-foreground cursor-not-allowed"
        />
      </div>

      {/* Category-Based Amount Table */}
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
                    {categories.map((category, catIdx) => (
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

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">Notes (Optional)</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any additional notes..."
          className="w-full px-4 py-2 rounded-lg border border-input bg-background resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Saving...' : bill ? 'Update Bill' : 'Create Bill'}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </motion.form>
  );
};

export default RentBillForm;
