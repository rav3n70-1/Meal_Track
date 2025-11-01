// Recurring Expenses Page
import React from 'react';
import Layout from '../components/Layout/Layout';
import RecurringExpenseManager from '../components/Recurring/RecurringExpenseManager';

const RecurringExpenses = () => {
  return (
    <Layout>
      <RecurringExpenseManager />
    </Layout>
  );
};

export default RecurringExpenses;

