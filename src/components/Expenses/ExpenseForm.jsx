// Form component for adding new expenses (supports multiple items)
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useHousehold } from '../../context/HouseholdContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import DatePicker from '../ui/DatePicker';
import CategorySelector from '../ui/CategorySelector';
import { ShoppingBag, Plus, Trash2, X, Upload, Zap } from 'lucide-react';
import { getDisplayName } from '../../utils/displayName';
import { QUICK_TEMPLATES } from '../../utils/quickTemplates';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const ExpenseForm = ({ onSuccess, onCancel, template = null }) => {
  const { currentUser } = useAuth();
  const { household, members } = useHousehold();
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [receiptFiles, setReceiptFiles] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    sharedAmong: template?.sharedAmong || [],
    notes: template?.notes || '',
    category: template?.category || 'other',
    splitType: 'equal'
  });

  const initialItems = template?.items ? template.items.map((item, idx) => ({
    id: Date.now() + idx,
    name: item.name,
    amount: item.amount,
    buyer: item.buyer || currentUser?.uid || '',
    category: item.category || template.category || 'other'
  })) : [
    {
      id: Date.now(),
      name: '',
      amount: '',
      buyer: currentUser?.uid || '',
      category: 'other'
    }
  ];

  const [items, setItems] = useState(initialItems);

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
        buyer: currentUser?.uid || '',
        category: formData.category
      }
    ]);
  };

  const loadTemplate = (templateId) => {
    const template = QUICK_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setItems(template.items.map((item, idx) => ({
        id: Date.now() + idx,
        name: item.name,
        amount: item.amount,
        buyer: currentUser?.uid || '',
        category: template.category
      })));
      setFormData(prev => ({ ...prev, category: template.category }));
      setShowTemplates(false);
      toast.success(`Template "${template.name}" loaded!`);
    }
  };

  const handleReceiptUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length + receiptFiles.length > 5) {
      toast.error('Maximum 5 receipts allowed');
      return;
    }

    setReceiptFiles(prev => [...prev, ...imageFiles]);
    toast.success(`${imageFiles.length} receipt(s) added`);
  };

  const removeReceipt = (index) => {
    setReceiptFiles(prev => prev.filter((_, i) => i !== index));
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
      const expensesRef = collection(db, 'households', household.id, 'expenses');
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.amount), 0);
      
      // Upload receipts if any (simplified - in production use Firebase Storage)
      const receiptUrls = receiptFiles.length > 0 ? 
        receiptFiles.map(file => URL.createObjectURL(file)) : [];

      // Create a single expense with multiple items
      await addDoc(expensesRef, {
        items: items.map(item => ({
          name: item.name.trim(),
          amount: parseFloat(item.amount),
          buyer: item.buyer,
          category: item.category || formData.category
        })),
        totalAmount: totalAmount,
        category: formData.category,
        date: formData.date,
        sharedAmong: formData.sharedAmong,
        splitType: formData.splitType,
        notes: formData.notes.trim(),
        receipts: receiptUrls,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        approvedBy: null,
        approvedAt: null
      });

      toast.success(`Expense with ${items.length} item${items.length > 1 ? 's' : ''} submitted for approval!`);
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        sharedAmong: [],
        notes: '',
        category: 'other',
        splitType: 'equal'
      });
      setItems([
        {
          id: Date.now(),
          name: '',
          amount: '',
          buyer: currentUser?.uid || '',
          category: 'other'
        }
      ]);
      setReceiptFiles([]);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding expenses:', error);
      toast.error('Failed to add expenses');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quick Templates */}
      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          icon={<Zap size={16} />}
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full"
        >
          {showTemplates ? 'Hide' : 'Quick Add Templates'}
        </Button>
        
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-accent/50 rounded-lg"
          >
            {QUICK_TEMPLATES.map(template => (
              <button
                key={template.id}
                type="button"
                onClick={() => loadTemplate(template.id)}
                className="p-2 border border-border rounded-lg hover:bg-background hover:shadow-md transition-all text-sm flex flex-col items-center gap-1"
              >
                <span className="text-2xl">{template.emoji}</span>
                <span className="text-xs font-medium text-center">{template.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Date Selection */}
      <DatePicker
        label="Purchase Date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        required
      />

      {/* Category Selection */}
      <CategorySelector
        value={formData.category}
        onChange={(categoryId) => {
          setFormData(prev => ({ ...prev, category: categoryId }));
          // Update all items with the new category
          setItems(prev => prev.map(item => ({ ...item, category: categoryId })));
        }}
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
                    options={members.filter(m => m.type !== 'manual' && m.role !== 'manual').map(member => ({
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
              {members.filter(member => member.type !== 'manual' && member.role !== 'manual').map(member => (
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

      {/* Receipt Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none">
          Receipt Images (Optional)
        </label>
        <div className="space-y-2">
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
            <Upload size={20} />
            <span className="text-sm">Upload Receipts (Max 5)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleReceiptUpload}
              className="hidden"
            />
          </label>
          
          {receiptFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {receiptFiles.map((file, index) => (
                <div key={index} className="relative group">
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-border">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Receipt ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeReceipt(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
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

