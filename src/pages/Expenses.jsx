// Expenses page for viewing and adding expenses
import React, { useState } from 'react';
import { Plus, LayoutList, Calendar as CalendarIcon, Download } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import ExpenseList from '../components/Expenses/ExpenseList';
import ExpenseDetails from '../components/Expenses/ExpenseDetails';
import ExpenseCalendar from '../components/Expenses/ExpenseCalendar';
import RecurringExpensesList from '../components/Expenses/RecurringExpensesList';
import RecurringExpenseForm from '../components/Expenses/RecurringExpenseForm';
import { useHousehold } from '../context/HouseholdContext';
import Loading from '../components/ui/Loading';
import { exportExpensesToExcel } from '../utils/exportData';
import toast from 'react-hot-toast';

const Expenses = () => {
  const { expenses, recurringExpenses, members, household, loading } = useHousehold();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'

  const handleEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setShowEditModal(true);
    setSelectedExpense(null); // Close details modal
  };

  const handleExportExcel = () => {
    try {
      if (!expenses || expenses.length === 0) {
        toast.error('No expenses available to export');
        return;
      }

      exportExpensesToExcel(expenses, members, household?.name || 'household');
      toast.success('Expenses exported to Excel successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to export expenses');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading text="Loading expenses..." />
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
            <h1 className="text-3xl font-bold mb-2">Expenses</h1>
            <p className="text-muted-foreground">
              View and manage all household expenses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleExportExcel}
              icon={<Download size={20} />}
            >
              Export Excel
            </Button>
            <Button
              onClick={() => setShowAddModal(true)}
              icon={<Plus size={20} />}
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 border-b border-border pb-1 overflow-x-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${viewMode === 'list'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <LayoutList size={18} />
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${viewMode === 'calendar'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <CalendarIcon size={18} />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('recurring')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${viewMode === 'recurring'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-repeat"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
            Recurring
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {viewMode === 'list' ? (
            <ExpenseList
              expenses={expenses}
              onExpenseClick={setSelectedExpense}
            />
          ) : viewMode === 'calendar' ? (
            <ExpenseCalendar />
          ) : (
            <RecurringExpensesList 
              recurringExpenses={recurringExpenses}
              onEdit={handleEditExpense}
            />
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={viewMode === 'recurring' ? "Add Recurring Expense" : "Add New Expense"}
        size="lg"
      >
        {viewMode === 'recurring' ? (
          <RecurringExpenseForm
            onSuccess={() => setShowAddModal(false)}
            onCancel={() => setShowAddModal(false)}
          />
        ) : (
          <ExpenseForm
            onSuccess={() => setShowAddModal(false)}
            onCancel={() => setShowAddModal(false)}
          />
        )}
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setExpenseToEdit(null);
        }}
        title={viewMode === 'recurring' ? "Edit Recurring Expense" : "Edit Expense"}
        size="lg"
      >
        {viewMode === 'recurring' ? (
          <RecurringExpenseForm
            expense={expenseToEdit}
            onSuccess={() => {
              setShowEditModal(false);
              setExpenseToEdit(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setExpenseToEdit(null);
            }}
          />
        ) : (
          <ExpenseForm
            expense={expenseToEdit}
            onSuccess={() => {
              setShowEditModal(false);
              setExpenseToEdit(null);
            }}
            onCancel={() => {
              setShowEditModal(false);
              setExpenseToEdit(null);
            }}
          />
        )}
      </Modal>

      {/* Expense Details Modal */}
      <ExpenseDetails
        expense={selectedExpense}
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        onEdit={handleEditExpense}
      />
    </Layout>
  );
};

export default Expenses;


