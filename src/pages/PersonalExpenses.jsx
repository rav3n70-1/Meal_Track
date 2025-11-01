// Personal Expenses page for tracking private expenses
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, Edit, Trash2, Calendar, Tag, DollarSign } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { usePersonalExpense } from '../context/PersonalExpenseContext';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const PersonalExpenses = () => {
  const { currentUser } = useAuth();
  const { personalExpenses, loading, addPersonalExpense, updatePersonalExpense, deletePersonalExpense } = usePersonalExpense();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const categories = [
    { value: 'food', label: '🍔 Food' },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'entertainment', label: '🎬 Entertainment' },
    { value: 'shopping', label: '🛍️ Shopping' },
    { value: 'health', label: '💊 Health' },
    { value: 'bills', label: '📄 Bills' },
    { value: 'education', label: '📚 Education' },
    { value: 'other', label: '📦 Other' }
  ];

  // Calculate total
  const totalExpenses = useMemo(() => {
    return personalExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
  }, [personalExpenses]);

  // Group expenses by month
  const expensesByMonth = useMemo(() => {
    const grouped = {};
    personalExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(expense);
    });
    return grouped;
  }, [personalExpenses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      toast.error('Title and amount are required');
      return;
    }

    try {
      await addPersonalExpense(formData);
      toast.success('Personal expense added successfully!');
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to add expense');
      console.error(error);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.amount) {
      toast.error('Title and amount are required');
      return;
    }

    try {
      await updatePersonalExpense(selectedExpense.id, formData);
      toast.success('Personal expense updated successfully!');
      resetForm();
      setShowEditModal(false);
      setSelectedExpense(null);
    } catch (error) {
      toast.error('Failed to update expense');
      console.error(error);
    }
  };

  const handleDelete = (expense) => {
    setSelectedExpense(expense);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await deletePersonalExpense(selectedExpense.id);
      toast.success('Personal expense deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedExpense(null);
    } catch (error) {
      toast.error('Failed to delete expense');
      console.error(error);
    }
  };

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading personal expenses..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Personal Expenses</h1>
            <p className="text-muted-foreground">
              Track your private expenses (visible only to you)
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            icon={<Plus size={18} />}
          >
            Add Expense
          </Button>
        </div>

        {/* Total Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Personal Expenses</p>
                <p className="text-3xl font-bold text-primary">৳{totalExpenses.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-primary/20 rounded-full">
                <Wallet className="text-primary" size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        {Object.keys(expensesByMonth).length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Wallet className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground mb-4">No personal expenses yet</p>
              <Button onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}>
                Add Your First Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(expensesByMonth).sort((a, b) => b[0].localeCompare(a[0])).map(([month, expenses]) => (
            <Card key={month}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar size={20} />
                  {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  <span className="text-sm text-muted-foreground ml-auto">
                    ৳{expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0).toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-accent rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{expense.title}</h3>
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                            {getCategoryLabel(expense.category)}
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-muted-foreground mb-1">{expense.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-primary">
                          ৳{parseFloat(expense.amount).toFixed(2)}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<Edit size={16} />}
                            onClick={() => handleEdit(expense)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={<Trash2 size={16} />}
                            onClick={() => handleDelete(expense)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Add Personal Expense"
        size="md"
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Lunch at restaurant"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (৳) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categories}
              icon={<Tag size={18} />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any notes..."
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Add Expense
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

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedExpense(null);
        }}
        title="Edit Personal Expense"
        size="md"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Lunch at restaurant"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Amount (৳) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categories}
              icon={<Tag size={18} />}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any notes..."
              className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows="3"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
                setSelectedExpense(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedExpense(null);
        }}
        title="Delete Personal Expense"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong>{selectedExpense?.title}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              icon={<Trash2 size={18} />}
              onClick={confirmDelete}
              className="flex-1"
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedExpense(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default PersonalExpenses;

