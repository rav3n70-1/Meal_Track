// Calendar View Page
import React, { useState } from 'react';
import Layout from '../components/Layout/Layout';
import ExpenseCalendar from '../components/Calendar/ExpenseCalendar';
import Card from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import { useHousehold } from '../context/HouseholdContext';
import { getCategoryLabel } from '../utils/categories';
import { getDisplayName } from '../utils/displayName';

const CalendarView = () => {
  const { expenses, members } = useHousehold();
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const getExpensesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return expenses.filter(exp => exp.date === dateStr && exp.status === 'approved');
  };

  const selectedExpenses = selectedDate ? getExpensesForDate(selectedDate) : [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar View</h1>
          <p className="text-muted-foreground">View expenses by date</p>
        </div>

        <ExpenseCalendar onDateClick={handleDateClick} />
      </div>

      {/* Date Details Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedDate ? selectedDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) : ''}
      >
        <div className="space-y-3">
          {selectedExpenses.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">
                {selectedExpenses.length} expense(s) on this date
              </p>
              {selectedExpenses.map((expense) => (
                <Card key={expense.id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {expense.items?.[0]?.name || 'Expense'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getCategoryLabel(expense.category)}
                      </p>
                      {expense.items && expense.items.length > 1 && (
                        <p className="text-xs text-muted-foreground">
                          +{expense.items.length - 1} more items
                        </p>
                      )}
                    </div>
                    <p className="font-bold text-primary">
                      ৳{(parseFloat(expense.totalAmount) || parseFloat(expense.amount) || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Shared among {expense.sharedAmong?.length || 0} members
                  </div>
                </Card>
              ))}
              <div className="pt-3 border-t border-border">
                <p className="font-semibold">
                  Total: ৳{selectedExpenses.reduce((sum, exp) => 
                    sum + (parseFloat(exp.totalAmount) || parseFloat(exp.amount) || 0), 0
                  ).toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No expenses on this date</p>
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default CalendarView;

