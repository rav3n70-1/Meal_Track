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

// Translation dictionary
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
  },
  bn: {
    // Navigation
    dashboard: 'ড্যাশবোর্ড',
    expenses: 'খরচ',
    members: 'সদস্য',
    reports: 'রিপোর্ট',
    activity: 'কার্যকলাপ',
    settings: 'সেটিংস',
    logout: 'লগআউট',
    
    // Common
    add: 'যোগ করুন',
    edit: 'সম্পাদনা',
    delete: 'মুছুন',
    save: 'সংরক্ষণ',
    cancel: 'বাতিল',
    submit: 'জমা দিন',
    approve: 'অনুমোদন',
    reject: 'প্রত্যাখ্যান',
    loading: 'লোড হচ্ছে...',
    back: 'পিছনে',
    close: 'বন্ধ করুন',
    
    // Auth
    signIn: 'গুগল দিয়ে সাইন ইন',
    welcome: 'স্বাগতম!',
    signOut: 'সাইন আউট',
    
    // Dashboard
    welcomeBack: 'আবার স্বাগতম',
    totalExpenses: 'মোট খরচ',
    approved: 'অনুমোদিত',
    pending: 'অপেক্ষমাণ',
    myBalance: 'আপনার ব্যালেন্স',
    youvePaid: 'আপনি পরিশোধ করেছেন',
    yourShare: 'আপনার অংশ',
    othersOweYou: 'অন্যরা আপনার কাছে পাওনা',
    youOweOthers: 'আপনি অন্যদের কাছে পাওনা',
    allSettled: 'সব হিসাব শেষ!',
    
    // Expenses
    addExpense: 'খরচ যোগ করুন',
    expenseDetails: 'খরচের বিবরণ',
    itemName: 'আইটেমের নাম',
    amount: 'পরিমাণ',
    buyer: 'ক্রেতা',
    date: 'তারিখ',
    sharedAmong: 'শেয়ারকৃত',
    notes: 'নোট',
    status: 'অবস্থা',
    paidBy: 'পরিশোধকারী',
    
    // Members
    inviteCode: 'আমন্ত্রণ কোড',
    householdMembers: 'পরিবারের সদস্য',
    copyCode: 'কোড কপি',
    copied: 'কপি হয়েছে!',
    manager: 'ম্যানেজার',
    member: 'সদস্য',
    
    // Currency
    currency: '৳',
    currencyName: 'টাকা',
    
    // Rent & Bills
    rentBills: 'ভাড়া ও বিল',
    rent: 'ভাড়া',
    bills: 'বিল',
    rentOnly: 'শুধুমাত্র ভাড়া',
    addBill: 'বিল যোগ করুন',
    editBill: 'বিল সম্পাদনা',
    recordPayment: 'পেমেন্ট রেকর্ড করুন',
    billType: 'বিলের ধরন',
    electricity: 'বিদ্যুৎ',
    water: 'পানি',
    gas: 'গ্যাস',
    internet: 'ইন্টারনেট',
    other: 'অন্যান্য',
    dueDate: 'পরিশোধের তারিখ',
    paidAmount: 'পরিশোধিত পরিমাণ',
    totalAmount: 'মোট পরিমাণ',
    unpaid: 'অপরিশোধিত',
    partial: 'আংশিক',
    paid: 'পরিশোধিত',
    overdue: 'বকেয়া',
    description: 'বর্ণনা',
    paymentNotes: 'পেমেন্ট নোট',
    addRentMember: 'ভাড়া সদস্য যোগ করুন',
    rentOnlyMembers: 'শুধুমাত্র ভাড়া সদস্য',
    recentBills: 'সাম্প্রতিক বিল'
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem('language');
    return stored || 'bn'; // Default to Bangla
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    // Set document language attribute
    document.documentElement.lang = language === 'bn' ? 'bn' : 'en';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'bn' : 'en');
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    toggleLanguage,
    t,
    isEnglish: language === 'en',
    isBangla: language === 'bn'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

