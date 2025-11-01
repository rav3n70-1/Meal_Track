// Budget Management Component
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import { calculateBudgetStatus, getBudgetRecommendations } from '../../utils/budget';
import { EXPENSE_CATEGORIES, getCategoryLabel } from '../../utils/categories';
import { getDisplayName } from '../../utils/displayName';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { Plus, TrendingUp, AlertTriangle, CheckCircle, Trash2, Edit } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const BudgetManager = () => {
  const { household, expenses, members } = useHousehold();
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [recommendations, setRecommendations] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'household', // 'household', 'category', 'member'
    categoryId: '',
    memberId: '',
    limit: '',
    period: 'monthly'
  });

  // Load budgets
  useEffect(() => {
    if (!household) return;

    const budgetsRef = collection(db, 'households', household.id, 'budgets');
    const unsubscribe = onSnapshot(budgetsRef, (snapshot) => {
      const budgetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBudgets(budgetsData);
    });

    return () => unsubscribe();
  }, [household]);

  // Calculate budget status
  useEffect(() => {
    if (budgets.length > 0 && expenses.length > 0) {
      const status = calculateBudgetStatus(budgets, expenses, members);
      setBudgetStatus(status);
    }
  }, [budgets, expenses, members]);

  // Get recommendations
  useEffect(() => {
    if (expenses.length > 0 && members.length > 0) {
      const recs = getBudgetRecommendations(expenses, members);
      setRecommendations(recs);
    }
  }, [expenses, members]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'household',
      categoryId: '',
      memberId: '',
      limit: '',
      period: 'monthly'
    });
    setEditingBudget(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const budgetData = {
        name: formData.name.trim(),
        type: formData.type,
        categoryId: formData.categoryId || null,
        memberId: formData.memberId || null,
        limit: parseFloat(formData.limit),
        period: formData.period,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingBudget) {
        const budgetRef = doc(db, 'households', household.id, 'budgets', editingBudget.id);
        await updateDoc(budgetRef, budgetData);
        toast.success('Budget updated successfully!');
      } else {
        const budgetsRef = collection(db, 'households', household.id, 'budgets');
        await addDoc(budgetsRef, budgetData);
        toast.success('Budget created successfully!');
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      type: budget.type,
      categoryId: budget.categoryId || '',
      memberId: budget.memberId || '',
      limit: budget.limit.toString(),
      period: budget.period
    });
    setShowAddModal(true);
  };

  const handleDelete = async (budgetId) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const budgetRef = doc(db, 'households', household.id, 'budgets', budgetId);
      await deleteDoc(budgetRef);
      toast.success('Budget deleted successfully!');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'exceeded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircle size={20} />;
      case 'warning': return <AlertTriangle size={20} />;
      case 'exceeded': return <AlertTriangle size={20} />;
      default: return <TrendingUp size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Budget Management</h2>
          <p className="text-muted-foreground">Track and manage your spending limits</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
          Add Budget
        </Button>
      </div>

      {/* Recommendations Card */}
      {recommendations && recommendations.basedOnMonths > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
          <div className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <TrendingUp size={20} />
              Budget Recommendation
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              Based on {recommendations.basedOnMonths} months of spending history
            </p>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-xs text-muted-foreground">Average Monthly:</span>
                <p className="text-xl font-bold">৳{recommendations.averageSpending}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Recommended Budget:</span>
                <p className="text-xl font-bold text-primary">৳{recommendations.recommendedMonthly}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(budgetStatus).map((budget) => {
          const progress = Math.min((budget.spent / budget.limit) * 100, 100);
          
          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card className="relative overflow-hidden">
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{budget.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {budget.type === 'category' && getCategoryLabel(budget.categoryId)}
                        {budget.type === 'member' && getDisplayName(members.find(m => m.uid === budget.memberId))}
                        {budget.type === 'household' && 'Household Budget'}
                      </p>
                    </div>
                    <div className={`p-2 rounded-full ${getStatusColor(budget.status)} text-white`}>
                      {getStatusIcon(budget.status)}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>৳{budget.spent.toFixed(0)} spent</span>
                      <span className="text-muted-foreground">of ৳{budget.limit}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full ${getStatusColor(budget.status)}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{budget.percentage}%</span>
                      <span className={budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {budget.remaining >= 0 ? '৳' + budget.remaining.toFixed(0) + ' left' : 'Exceeded by ৳' + Math.abs(budget.remaining).toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={14} />}
                      onClick={() => handleEdit(budget)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(budget.id)}
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <Card className="p-12 text-center">
          <TrendingUp size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Budgets Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first budget to start tracking your spending limits
          </p>
          <Button onClick={() => setShowAddModal(true)}>Create Budget</Button>
        </Card>
      )}

      {/* Add/Edit Budget Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Budget Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Monthly Groceries"
            required
          />

          <Select
            label="Budget Type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            options={[
              { value: 'household', label: 'Household (Overall)' },
              { value: 'category', label: 'Category' },
              { value: 'member', label: 'Member' }
            ]}
          />

          {formData.type === 'category' && (
            <Select
              label="Category"
              value={formData.categoryId}
              onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
              options={EXPENSE_CATEGORIES.map(cat => ({
                value: cat.id,
                label: `${cat.emoji} ${cat.label}`
              }))}
              required
            />
          )}

          {formData.type === 'member' && (
            <Select
              label="Member"
              value={formData.memberId}
              onChange={(e) => setFormData(prev => ({ ...prev, memberId: e.target.value }))}
              options={members.map(member => ({
                value: member.uid,
                label: getDisplayName(member)
              }))}
              required
            />
          )}

          <Input
            label="Budget Limit (৳)"
            type="number"
            step="0.01"
            min="0"
            value={formData.limit}
            onChange={(e) => setFormData(prev => ({ ...prev, limit: e.target.value }))}
            placeholder="0.00"
            required
          />

          <Select
            label="Period"
            value={formData.period}
            onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'yearly', label: 'Yearly' }
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingBudget ? 'Update' : 'Create'} Budget
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

export default BudgetManager;

