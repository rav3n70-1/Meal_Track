// Savings Goals Component
import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useHousehold } from '../../context/HouseholdContext';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import { Target, Plus, Edit, Trash2, TrendingUp, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SavingsGoals = () => {
  const { household } = useHousehold();
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: '',
    description: ''
  });

  // Load goals
  useEffect(() => {
    if (!household) return;

    const goalsRef = collection(db, 'households', household.id, 'savingsGoals');
    const unsubscribe = onSnapshot(goalsRef, (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoals(goalsData);
    });

    return () => unsubscribe();
  }, [household]);

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      deadline: '',
      description: ''
    });
    setEditingGoal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const goalData = {
        name: formData.name.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount),
        deadline: formData.deadline,
        description: formData.description.trim(),
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingGoal) {
        const goalRef = doc(db, 'households', household.id, 'savingsGoals', editingGoal.id);
        await updateDoc(goalRef, goalData);
        toast.success('Goal updated!');
      } else {
        const goalsRef = collection(db, 'households', household.id, 'savingsGoals');
        await addDoc(goalsRef, goalData);
        toast.success('Goal created!');
      }

      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('Failed to save goal');
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline,
      description: goal.description
    });
    setShowAddModal(true);
  };

  const handleAddProgress = async (goal, amount) => {
    try {
      const newAmount = goal.currentAmount + parseFloat(amount);
      const goalRef = doc(db, 'households', household.id, 'savingsGoals', goal.id);
      await updateDoc(goalRef, {
        currentAmount: newAmount,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Added ৳${amount} to goal!`);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const handleDelete = async (goalId) => {
    if (!confirm('Delete this savings goal?')) return;

    try {
      const goalRef = doc(db, 'households', household.id, 'savingsGoals', goalId);
      await deleteDoc(goalRef);
      toast.success('Goal deleted!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const calculateProgress = (goal) => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return Math.min(progress, 100);
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Savings Goals</h2>
          <p className="text-muted-foreground">Track your household savings targets</p>
        </div>
        <Button icon={<Plus size={18} />} onClick={() => setShowAddModal(true)}>
          Add Goal
        </Button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => {
          const progress = calculateProgress(goal);
          const daysRemaining = getDaysRemaining(goal.deadline);
          const isCompleted = progress >= 100;

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              layout
            >
              <Card className={`relative overflow-hidden ${isCompleted ? 'border-green-500 border-2' : ''}`}>
                {isCompleted && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="text-green-500" size={24} />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="text-primary" size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{goal.name}</h3>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {goal.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>৳{goal.currentAmount.toFixed(0)}</span>
                      <span className="text-muted-foreground">of ৳{goal.targetAmount.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{progress.toFixed(1)}%</span>
                      {daysRemaining >= 0 ? (
                        <span className={daysRemaining < 30 ? 'text-orange-600' : 'text-muted-foreground'}>
                          {daysRemaining} days left
                        </span>
                      ) : (
                        <span className="text-red-600">Overdue</span>
                      )}
                    </div>
                  </div>

                  {/* Remaining Amount */}
                  {!isCompleted && (
                    <div className="text-center py-2 bg-accent rounded-lg">
                      <p className="text-xs text-muted-foreground">Still need</p>
                      <p className="text-lg font-bold">৳{(goal.targetAmount - goal.currentAmount).toFixed(0)}</p>
                    </div>
                  )}

                  {/* Quick Add */}
                  {!isCompleted && (
                    <div className="flex gap-2">
                      {[100, 500, 1000].map(amount => (
                        <button
                          key={amount}
                          onClick={() => handleAddProgress(goal, amount)}
                          className="flex-1 py-1 px-2 text-xs border border-border rounded hover:bg-accent transition-colors"
                        >
                          +৳{amount}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit size={14} />}
                      onClick={() => handleEdit(goal)}
                      className="flex-1"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDelete(goal.id)}
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

      {goals.length === 0 && (
        <Card className="p-12 text-center">
          <Target size={48} className="mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No Savings Goals Yet</h3>
          <p className="text-muted-foreground mb-4">
            Set savings goals and track your progress together
          </p>
          <Button onClick={() => setShowAddModal(true)}>Create Your First Goal</Button>
        </Card>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Goal Name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Emergency Fund"
            required
          />

          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description (optional)"
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />

          <Input
            label="Target Amount (৳)"
            type="number"
            step="0.01"
            min="0"
            value={formData.targetAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
            placeholder="0.00"
            required
          />

          <Input
            label="Current Amount (৳)"
            type="number"
            step="0.01"
            min="0"
            value={formData.currentAmount}
            onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
            placeholder="0.00"
            required
          />

          <Input
            label="Deadline"
            type="date"
            value={formData.deadline}
            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingGoal ? 'Update' : 'Create'} Goal
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

export default SavingsGoals;

