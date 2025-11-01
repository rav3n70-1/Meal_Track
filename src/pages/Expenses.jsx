// Expenses page for viewing and adding expenses
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import ExpenseList from '../components/Expenses/ExpenseList';
import ExpenseDetails from '../components/Expenses/ExpenseDetails';
import { useHousehold } from '../context/HouseholdContext';
import Loading from '../components/ui/Loading';

const Expenses = () => {
  const { expenses, loading } = useHousehold();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  const handleEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setShowEditModal(true);
    setSelectedExpense(null); // Close details modal
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
          <Button
            onClick={() => setShowAddModal(true)}
            icon={<Plus size={20} />}
          >
            Add Expense
          </Button>
        </div>

        {/* Expense List */}
        <ExpenseList 
          expenses={expenses}
          onExpenseClick={setSelectedExpense}
        />
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Expense"
        size="lg"
      >
        <ExpenseForm
          onSuccess={() => setShowAddModal(false)}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setExpenseToEdit(null);
        }}
        title="Edit Expense"
        size="lg"
      >
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

