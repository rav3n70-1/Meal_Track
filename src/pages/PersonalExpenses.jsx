// Personal Expenses page for tracking private expenses
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, LayoutList, Calendar as CalendarIcon, PieChart, Trash2 } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import DatePicker from '../components/ui/DatePicker';
import { usePersonalExpense } from '../context/PersonalExpenseContext';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

// New Components
import PersonalExpenseCalendar from '../components/PersonalExpenses/PersonalExpenseCalendar';
import PersonalExpenseCharts from '../components/PersonalExpenses/PersonalExpenseCharts';
import PersonalExpenseFilter from '../components/PersonalExpenses/PersonalExpenseFilter';
import PersonalExpenseList from '../components/PersonalExpenses/PersonalExpenseList';

const PersonalExpenses = () => {
  const { currentUser } = useAuth();
  const { personalExpenses, loading, addPersonalExpense, updatePersonalExpense, deletePersonalExpense } = usePersonalExpense();

  // UI State
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'charts'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Filter State
  const [filters, setFilters] = useState({
    category: 'all',
    startDate: '',
    endDate: ''
  });

  // Form Data
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Recent Titles for Dropdown
  const [recentTitles, setRecentTitles] = useState([]);

  useEffect(() => {
    const savedTitles = localStorage.getItem('recentExpenseTitles');
    if (savedTitles) {
      setRecentTitles(JSON.parse(savedTitles));
    }
  }, []);

  const saveTitle = (title) => {
    if (!title) return;
    const newTitles = [...new Set([title, ...recentTitles])].slice(0, 20); // Keep last 20 unique titles
    setRecentTitles(newTitles);
    localStorage.setItem('recentExpenseTitles', JSON.stringify(newTitles));
  };

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

  const getCategoryLabel = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  // Filter Logic
  const filteredExpenses = useMemo(() => {
    return personalExpenses.filter(expense => {
      // Category Filter
      if (filters.category !== 'all' && expense.category !== filters.category) {
        return false;
      }

      // Date Range Filter
      const expenseDate = new Date(expense.date);
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        if (expenseDate < start) return false;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        if (expenseDate > end) return false;
      }

      return true;
    });
  }, [personalExpenses, filters]);

  // Calculate total
  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
  }, [filteredExpenses]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      startDate: '',
      endDate: ''
    });
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
      saveTitle(formData.title.trim());
      toast.success('Personal expense added successfully!');
      resetForm();
      setShowAddModal(false);
    } catch (error) {
      toast.error('Failed to add expense');
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
      saveTitle(formData.title.trim());
      toast.success('Personal expense updated successfully!');
      resetForm();
      setShowEditModal(false);
      setSelectedExpense(null);
    } catch (error) {
      toast.error('Failed to update expense');
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
    }
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                <p className="text-sm text-muted-foreground mb-1">Total Expenses (Filtered)</p>
                <p className="text-3xl font-bold text-primary">৳{totalExpenses.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-primary/20 rounded-full">
                <Wallet className="text-primary" size={32} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <PersonalExpenseFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
          categories={categories}
        />

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-border pb-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${viewMode === 'list'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutList size={18} />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${viewMode === 'calendar'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <CalendarIcon size={18} />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('charts')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${viewMode === 'charts'
              ? 'border-primary text-primary font-medium'
              : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <PieChart size={18} />
            Analytics
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {viewMode === 'list' && (
            <PersonalExpenseList
              expenses={filteredExpenses}
              onEdit={handleEdit}
              onDelete={handleDelete}
              getCategoryLabel={getCategoryLabel}
            />
          )}

          {viewMode === 'calendar' && (
            <PersonalExpenseCalendar />
          )}

          {viewMode === 'charts' && (
            <PersonalExpenseCharts expenses={filteredExpenses} />
          )}
        </div>
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
            <div className="relative">
              <input
                list="title-options"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Lunch at restaurant"
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
                autoComplete="off"
              />
              <datalist id="title-options">
                {recentTitles.map((title, index) => (
                  <option key={index} value={title} />
                ))}
              </datalist>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Type to create new or select from recent
            </p>
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
            />
          </div>

          <DatePicker
            label="Date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

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
            <div className="relative">
              <input
                list="edit-title-options"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Lunch at restaurant"
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                required
                autoComplete="off"
              />
              <datalist id="edit-title-options">
                {recentTitles.map((title, index) => (
                  <option key={index} value={title} />
                ))}
              </datalist>
            </div>
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
            />
          </div>

          <DatePicker
            label="Date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

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


