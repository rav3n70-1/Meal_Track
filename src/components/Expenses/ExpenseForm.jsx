// Form component for adding new expenses (supports multiple items)
import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import { ShoppingBag, Plus, Trash2, X } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import { roundUpSharedAmount } from '../../utils/calculations';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ExpenseForm = ({ expense = null, onSuccess, onCancel }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(false);

  // Initialize form data based on whether we're editing or creating
  const [formData, setFormData] = useState({
    date: expense?.date || new Date().toISOString().split('T')[0],
    sharedAmong: expense?.sharedAmong || [],
    notes: expense?.notes || ''
  });

  const [items, setItems] = useState([
    {
      id: Date.now(),
      name: '',
      amount: '',
      buyer: currentUser?.uid || ''
    }
  ]);

  // Load expense data if editing
  useEffect(() => {
    if (expense) {
      // Load form data
      setFormData({
        date: expense.date || new Date().toISOString().split('T')[0],
        sharedAmong: expense.sharedAmong || [],
        notes: expense.notes || ''
      });

      // Support both old and new format
      if (expense.items && Array.isArray(expense.items)) {
        setItems(expense.items.map((item, idx) => ({
          id: Date.now() + idx,
          name: item.name,
          amount: item.amount.toString(),
          buyer: item.buyer
        })));
      } else {
        setItems([{
          id: Date.now(),
          name: expense.item || '',
          amount: (expense.amount || 0).toString(),
          buyer: expense.buyer || currentUser?.uid || ''
        }]);
      }
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        amount: '',
        buyer: currentUser?.uid || ''
      }
    ]);
  };

  const removeItem = (id) => {
    if (items.length === 1) {
      toast.error('You must have at least one item');
      return;
    }
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate items
    const invalidItem = items.find(item => !item.name.trim() || !item.amount || parseFloat(item.amount) <= 0);
    if (invalidItem) {
      toast.error('Please fill in all item details with valid amounts');
      return;
    }

    if (formData.sharedAmong.length === 0) {
      toast.error('Please select at least one person to share the expenses');
      return;
    }

    setLoading(true);

    try {
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      
      const expenseData = {
        items: items.map(item => ({
          name: item.name.trim(),
          amount: parseFloat(item.amount),
          buyer: item.buyer
        })),
        totalAmount: totalAmount,
        date: formData.date,
        sharedAmong: formData.sharedAmong,
        notes: formData.notes.trim()
      };

      if (expense) {
        // Update existing expense - preserve original fields
        const expenseRef = doc(db, 'households', household.id, 'expenses', expense.id);
        await updateDoc(expenseRef, {
          ...expenseData,
          // Preserve original metadata
          status: expense.status || 'pending',
          createdAt: expense.createdAt || new Date().toISOString(),
          createdBy: expense.createdBy || currentUser.uid,
          approvedBy: expense.approvedBy || null,
          approvedAt: expense.approvedAt || null,
          updatedAt: new Date().toISOString()
        });
        toast.success(`Expense updated successfully!`);
      } else {
        // Create new expense
        const expensesRef = collection(db, 'households', household.id, 'expenses');
        await addDoc(expensesRef, {
          ...expenseData,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: currentUser.uid,
          approvedBy: null,
          approvedAt: null
        });
        toast.success(`Expense with ${items.length} item${items.length > 1 ? 's' : ''} submitted for approval!`);
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || `Failed to ${expense ? 'update' : 'add'} expense`);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  
  // Calculate rounding for shared amounts
  const shareCalc = formData.sharedAmong.length > 0 && totalAmount > 0
    ? roundUpSharedAmount(totalAmount, formData.sharedAmong.length)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Selection */}
      <DatePicker
        label="Purchase Date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Items ({items.length})</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Plus size={16} />}
            onClick={addItem}
          >
            Add Item
          </Button>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-4 border border-border rounded-lg space-y-3 bg-accent/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Item #{index + 1}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<X size={16} />}
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Input
                  label="Item Name"
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                  placeholder="e.g., Rice, Vegetables, etc."
                  icon={<ShoppingBag size={18} />}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Amount (৳)"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.amount}
                    onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                    placeholder="0.00"
                    icon={<span className="text-primary font-bold">৳</span>}
                    required
                  />

                  <Select
                    label="Buyer"
                    value={item.buyer}
                    onChange={(e) => handleItemChange(item.id, 'buyer', e.target.value)}
                    options={members.map(member => ({
                      value: member.uid,
                      label: getDisplayName(member)
                    }))}
                    required
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Total */}
        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total Amount:</span>
            <span className="text-xl font-bold text-primary">৳{totalAmount.toFixed(2)}</span>
          </div>
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
        
        {/* Show rounding calculation */}
                  {shareCalc && (
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
              <p className="text-sm font-medium text-primary">Calculation Breakdown:</p>
              <div className="space-y-2 text-xs text-muted-foreground">
               <div className="flex items-center gap-2">
                 <span className="font-medium">Total:</span>
                 <span>৳{totalAmount.toFixed(2)}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-medium">Shared among:</span>
                 <span>{formData.sharedAmong.length} {formData.sharedAmong.length === 1 ? 'person' : 'people'}</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="font-medium">Exact share:</span>
                 <span>৳{shareCalc.exact.toFixed(2)}</span>
                              </div>
               <div className="flex items-center gap-2 text-primary font-semibold">
                 <span className="font-medium">Rounded to nearest 10:</span>
                 <span>
                   ৳{shareCalc.exact.toFixed(2)}
                   {shareCalc.difference !== 0 && (
                     <>
                       {shareCalc.difference > 0 ? '+' : ''}৳{Math.abs(shareCalc.difference).toFixed(2)}
                     </>
                   )}
                   {' = '}৳{shareCalc.rounded.toFixed(2)}
                                  </span>
               </div>
               <div className="pt-2 border-t border-primary/20 text-xs italic text-muted-foreground">
                 This rounding up is necessary to make calculations and debt payment easier
               </div>
             </div>
          </div>
        )}
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

