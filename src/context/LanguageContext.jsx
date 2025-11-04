// Language Context for managing Bangla/English language
import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation dictionary (English only)
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    expenses: 'Expenses',
    members: 'Members',
    reports: 'Reports',
    activity: 'Activity Log',
    settings: 'Settings',
    logout: 'Logout',
    
    // Common
    add: 'Add',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    approve: 'Approve',
    reject: 'Reject',
    loading: 'Loading...',
    back: 'Back',
    close: 'Close',
    
    // Auth
    signIn: 'Sign in with Google',
    welcome: 'Welcome!',
    signOut: 'Sign out',
    
    // Dashboard
    welcomeBack: 'Welcome back',
    totalExpenses: 'Total Expenses',
    approved: 'Approved',
    pending: 'Pending',
    myBalance: 'Your Balance',
    youvePaid: "You've paid",
    yourShare: 'Your share is',
    othersOweYou: 'Others owe you money',
    youOweOthers: 'You owe others money',
    allSettled: "You're all settled up!",
    
    // Expenses
    addExpense: 'Add Expense',
    expenseDetails: 'Expense Details',
    itemName: 'Item Name',
    amount: 'Amount',
    buyer: 'Buyer',
    date: 'Date',
    sharedAmong: 'Shared Among',
    notes: 'Notes',
    status: 'Status',
    paidBy: 'Paid By',
    
    // Members
    inviteCode: 'Invite Code',
    householdMembers: 'Household Members',
    copyCode: 'Copy Code',
    copied: 'Copied!',
    manager: 'Manager',
    member: 'Member',
    
    // Currency
    currency: '৳',
    currencyName: 'Taka',
    
    // Rent & Bills
    rentBills: 'Rent & Bills',
    rent: 'Rent',
    bills: 'Bills',
    rentOnly: 'Rent Only',
    addBill: 'Add Bill',
    editBill: 'Edit Bill',
    recordPayment: 'Record Payment',
    billType: 'Bill Type',
    electricity: 'Electricity',
    water: 'Water',
    gas: 'Gas',
    internet: 'Internet',
    other: 'Other',
    dueDate: 'Due Date',
    paidAmount: 'Paid Amount',
    totalAmount: 'Total Amount',
    unpaid: 'Unpaid',
    partial: 'Partial',
    paid: 'Paid',
    overdue: 'Overdue',
    description: 'Description',
    paymentNotes: 'Payment Notes',
    addRentMember: 'Add Rent Member',
    rentOnlyMembers: 'Rent-Only Members',
    recentBills: 'Recent Bills'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language] = useState('en');

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  const t = (key) => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    t,
    isEnglish: true,
    isBangla: false
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

