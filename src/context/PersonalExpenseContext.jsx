// Personal Expense Context for managing user's private expenses
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const PersonalExpenseContext = createContext();

export const usePersonalExpense = () => {
  const context = useContext(PersonalExpenseContext);
  if (!context) {
    throw new Error('usePersonalExpense must be used within a PersonalExpenseProvider');
  }
  return context;
};

export const PersonalExpenseProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [personalExpenses, setPersonalExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load personal expenses
  useEffect(() => {
    if (!currentUser) {
      setPersonalExpenses([]);
      setLoading(false);
      return;
    }

    // Listen to personal expenses changes
    const expensesRef = collection(db, 'personalExpenses');
    const q = query(
      expensesRef, 
      where('userId', '==', currentUser.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPersonalExpenses(expensesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Add personal expense
  const addPersonalExpense = async (expenseData) => {
    if (!currentUser) throw new Error('User must be logged in');

    try {
      const expensesRef = collection(db, 'personalExpenses');
      await addDoc(expensesRef, {
        ...expenseData,
        userId: currentUser.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error adding personal expense:', error);
      throw error;
    }
  };

  // Update personal expense
  const updatePersonalExpense = async (expenseId, updates) => {
    if (!currentUser) throw new Error('User must be logged in');

    try {
      const expenseRef = doc(db, 'personalExpenses', expenseId);
      await updateDoc(expenseRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating personal expense:', error);
      throw error;
    }
  };

  // Delete personal expense
  const deletePersonalExpense = async (expenseId) => {
    if (!currentUser) throw new Error('User must be logged in');

    try {
      const expenseRef = doc(db, 'personalExpenses', expenseId);
      await deleteDoc(expenseRef);
    } catch (error) {
      console.error('Error deleting personal expense:', error);
      throw error;
    }
  };

  // Calculate total personal expenses
  const getTotalPersonalExpenses = () => {
    return personalExpenses.reduce((total, expense) => {
      return total + (parseFloat(expense.amount) || 0);
    }, 0);
  };

  // Get expenses by date range
  const getExpensesByDateRange = (startDate, endDate) => {
    return personalExpenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  // Get expenses by category
  const getExpensesByCategory = (category) => {
    return personalExpenses.filter(expense => expense.category === category);
  };

  const value = {
    personalExpenses,
    loading,
    addPersonalExpense,
    updatePersonalExpense,
    deletePersonalExpense,
    getTotalPersonalExpenses,
    getExpensesByDateRange,
    getExpensesByCategory
  };

  return (
    <PersonalExpenseContext.Provider value={value}>
      {children}
    </PersonalExpenseContext.Provider>
  );
};

