// Recurring Expense Manager Component
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { RECURRING_FREQUENCIES, calculateNextOccurrence, processRecurringExpenses } from '../../utils/recurring';
import { EXPENSE_CATEGORIES, getCategoryLabel } from '../../utils/categories';
import { getDisplayName } from '../../utils/displayName';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import CategorySelector from '../ui/CategorySelector';
import { Plus, Repeat, Pause, Play, Trash2, Edit, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const RecurringExpenseManager = () => {
  const { household, members } = useHousehold();
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    frequency: 'monthly',
    category: 'other',
    splitType: 'equal', // 'equal' or 'custom'
    totalAmount: '',
    buyer: currentUser?.uid || '',
    memberAmounts: {}, // { memberId: amount }
    sharedAmong: [],
    notes: '',
    autoApprove: false,
    startDate: new Date().toISOString().split('T')[0]
  });

  // Load recurring templates
  useEffect(() => {
    if (!household) return;

    const templatesRef = collection(db, 'households', household.id, 'recurringTemplates');
    const unsubscribe = onSnapshot(templatesRef, (snapshot) => {
      const templatesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTemplates(templatesData);
    });

    return () => unsubscribe();
  }, [household]);

  // Check and process recurring expenses every hour
  useEffect(() => {
    if (!household || templates.length === 0) return;

    const checkRecurring = async () => {
      await processRecurringExpenses(household.id, templates, currentUser.uid);
    };

    // Check immediately
    checkRecurring();

    // Then check every hour
    const interval = setInterval(checkRecurring, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [household, templates, currentUser]);

  const resetForm = () => {
    setFormData({
      name: '',
      frequency: 'monthly',
      category: 'other',
      splitType: 'equal',
      totalAmount: '',
      buyer: currentUser?.uid || '',
      memberAmounts: {},
      sharedAmong: [],
      notes: '',
      autoApprove: false,
      startDate: new Date().toISOString().split('T')[0]
    });
    setEditingTemplate(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.sharedAmong.length === 0) {
      toast.error('Please select at least one person to share expenses');
      return;
    }

    // Validate custom amounts
    if (formData.splitType === 'custom') {
      const totalCustom = formData.sharedAmong.reduce((sum, memberId) => {
        return sum + (parseFloat(formData.memberAmounts[memberId]) || 0);
      }, 0);
      const totalExpected = parseFloat(formData.totalAmount);
      
      if (Math.abs(totalCustom - totalExpected) > 0.01) {
        toast.error(`Custom amounts (৳${totalCustom.toFixed(2)}) must equal total amount (৳${totalExpected.toFixed(2)})`);
        return;
      }
    }

    try {
      const nextOccurrence = formData.startDate;
      const totalAmount = parseFloat(formData.totalAmount);
      
      const templateData = {
        name: formData.name.trim(),
        frequency: formData.frequency,
        category: formData.category,
        splitType: formData.splitType,
        items: [{
          name: formData.name.trim(),
          amount: totalAmount,
          buyer: formData.buyer
        }],
        totalAmount: totalAmount,
        memberAmounts: formData.splitType === 'custom' ? formData.memberAmounts : {},
        sharedAmong: formData.sharedAmong,
        notes: formData.notes.trim(),
        autoApprove: formData.autoApprove,
        nextOccurrence: nextOccurrence,
        isActive: true,
        timesCreated: editingTemplate?.timesCreated || 0,
        createdBy: currentUser.uid,
        createdAt: editingTemplate?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingTemplate) {
        const templateRef = doc(db, 'households', household.id, 'recurringTemplates', editingTemplate.id);
        await updateDoc(templateRef, templateData);
        toast.success('Recurring expense updated!');
      } else {
        const templatesRef = collection(db, 'households', household.id, 'recurringTemplates');
        await addDoc(templatesRef, templateData);
        toast.success('Recurring expense created!');
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving recurring expense:', error);
      toast.error('Failed to save recurring expense');
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      frequency: template.frequency,
      category: template.category,
      splitType: template.splitType || 'equal',
      totalAmount: template.totalAmount.toString(),
      buyer: template.items[0]?.buyer || currentUser.uid,
      memberAmounts: template.memberAmounts || {},
      sharedAmong: template.sharedAmong,
      notes: template.notes,
      autoApprove: template.autoApprove,
      startDate: template.nextOccurrence
    });
    setShowAddModal(true);
  };

  const toggleActive = async (template) => {
    try {
      const templateRef = doc(db, 'households', household.id, 'recurringTemplates', template.id);
      await updateDoc(templateRef, {
        isActive: !template.isActive,
        updatedAt: new Date().toISOString()
      });
      toast.success(template.isActive ? 'Paused recurring expense' : 'Resumed recurring expense');
    } catch (error) {
      console.error('Error toggling template:', error);
      toast.error('Failed to update template');
    }
  };

  const handleDelete = async (templateId) => {
    if (!confirm('Are you sure you want to delete this recurring expense?')) return;

    try {
      const templateRef = doc(db, 'households', household.id, 'recurringTemplates', templateId);
      await deleteDoc(templateRef);
      toast.success('Recurring expense deleted!');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Expenses</h2>
          <p className="text-muted-foreground">Automate regular expenses</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
          Add Recurring Expense
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
          >
            <Card className={`relative overflow-hidden ${!template.isActive ? 'opacity-60' : ''}`}>
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Repeat size={16} className="text-primary" />
                      <h3 className="font-semibold line-clamp-1">{template.name}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getCategoryLabel(template.category)}
                    </p>
                  </div>
                  {template.autoApprove && (
                    <div className="bg-green-500 text-white p-1 rounded" title="Auto-approved">
                      <CheckCircle size={16} />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">৳{template.totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="capitalize">{template.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Date:</span>
                    <span>{new Date(template.nextOccurrence).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{template.timesCreated} times</span>
                  </div>
                </div>

                {/* Shared Among */}
                <div className="text-xs">
                  <span className="text-muted-foreground">Shared: </span>
                  <span>{template.sharedAmong.length} members</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={template.isActive ? <Pause size={14} /> : <Play size={14} />}
                    onClick={() => toggleActive(template)}
                    className="flex-1"
                  >
                    {template.isActive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Edit size={14} />}
                    onClick={() => handleEdit(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Trash2 size={14} />}
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-12 text-center">
          <Repeat size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Recurring Expenses Yet</h3>
          <p className="text-muted-foreground mb-4">
            Automate regular expenses like rent, utilities, and subscriptions
          </p>
          <Button onClick={() => setShowAddModal(true)}>Create Recurring Expense</Button>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingTemplate ? 'Edit Recurring Expense' : 'Create Recurring Expense'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Expense Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Monthly Rent"
            required
          />

          <CategorySelector
            value={formData.category}
            onChange={(categoryId) => setFormData(prev => ({ ...prev, category: categoryId }))}
            required
          />

          <Input
            label="Total Amount (৳)"
            type="number"
            step="0.01"
            min="0"
            value={formData.totalAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
            placeholder="0.00"
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Split Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: 'equal' }))}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  formData.splitType === 'equal'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                Equal Split
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, splitType: 'custom' }))}
                className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                  formData.splitType === 'custom'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:bg-accent'
                }`}
              >
                Custom Amounts
              </button>
            </div>
          </div>

          <Select
            label="Frequency"
            value={formData.frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
            options={RECURRING_FREQUENCIES}
          />

          <Select
            label="Buyer"
            value={formData.buyer}
            onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
            options={members.map(member => ({
              value: member.uid,
              label: getDisplayName(member)
            }))}
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Shared Among {formData.splitType === 'custom' && '(Set Individual Amounts)'}
            </label>
            <div className="border border-input rounded-md p-3 space-y-2 max-h-[300px] overflow-y-auto">
              {members.map(member => {
                const isSelected = formData.sharedAmong.includes(member.uid);
                const equalAmount = formData.totalAmount && formData.sharedAmong.length > 0
                  ? (parseFloat(formData.totalAmount) / formData.sharedAmong.length).toFixed(2)
                  : '0.00';
                
                return (
                  <div key={member.uid} className="space-y-2">
                    <label 
                      className="flex items-center gap-2 cursor-pointer hover:bg-accent p-2 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        value={member.uid}
                        checked={isSelected}
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
                      <span className="text-sm flex-1">{getDisplayName(member)}</span>
                      {formData.splitType === 'equal' && isSelected && (
                        <span className="text-xs text-muted-foreground">৳{equalAmount}</span>
                      )}
                    </label>
                    
                    {formData.splitType === 'custom' && isSelected && (
                      <div className="ml-6 pl-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.memberAmounts[member.uid] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            memberAmounts: {
                              ...prev.memberAmounts,
                              [member.uid]: e.target.value
                            }
                          }))}
                          placeholder="Amount for this member"
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {formData.splitType === 'custom' && formData.sharedAmong.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Total assigned: ৳{formData.sharedAmong.reduce((sum, memberId) => 
                  sum + (parseFloat(formData.memberAmounts[memberId]) || 0), 0
                ).toFixed(2)} / ৳{formData.totalAmount || '0.00'}
              </div>
            )}
          </div>

          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoApprove"
              checked={formData.autoApprove}
              onChange={(e) => setFormData(prev => ({ ...prev, autoApprove: e.target.checked }))}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-2"
            />
            <label htmlFor="autoApprove" className="text-sm cursor-pointer">
              Auto-approve expenses (skip approval process)
            </label>
          </div>

          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes..."
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RecurringExpenseManager;

