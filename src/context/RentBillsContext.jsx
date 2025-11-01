// Context for managing Rent and Bills feature
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { useHousehold } from './HouseholdContext';

const RentBillsContext = createContext();

export const useRentBills = () => {
  const context = useContext(RentBillsContext);
  if (!context) {
    throw new Error('useRentBills must be used within a RentBillsProvider');
  }
  return context;
};

export const RentBillsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { household, getUserRole } = useHousehold();
  const [rentBillMembers, setRentBillMembers] = useState([]);
  const [rentBills, setRentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is a rent-only member (always false now - rent members are just records)
  const isRentOnlyMember = () => {
    return false;
  };

  // Add a rent-only member (manager only)
  const addRentBillMember = async (memberData) => {
    if (!household) throw new Error('No household selected');
    const role = getUserRole();
    if (role !== 'manager') throw new Error('Only managers can add rent-only members');

    try {
      const memberRef = doc(db, 'households', household.id, 'rentBillMembers', memberData.uid);
      await setDoc(memberRef, {
        uid: memberData.uid,
        email: memberData.email,
        name: memberData.name || memberData.email.split('@')[0],
        nickname: memberData.nickname || '',
        isRentOnly: true,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  };

  // Update rent-only member
  const updateRentBillMember = async (memberId, updates) => {
    if (!household) throw new Error('No household selected');
    const role = getUserRole();
    if (role !== 'manager' && currentUser?.uid !== memberId) {
      throw new Error('Only managers can update other members');
    }

    try {
      const memberRef = doc(db, 'households', household.id, 'rentBillMembers', memberId);
      await updateDoc(memberRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  };

  // Remove rent-only member (manager only)
  const removeRentBillMember = async (memberId) => {
    if (!household) throw new Error('No household selected');
    const role = getUserRole();
    if (role !== 'manager') throw new Error('Only managers can remove rent-only members');

    try {
      const memberRef = doc(db, 'households', household.id, 'rentBillMembers', memberId);
      await deleteDoc(memberRef);
    } catch (error) {
      throw error;
    }
  };

  // Create a rent/bill entry (manager only)
  const createRentBill = async (billData) => {
    if (!household) throw new Error('No household selected');
    const role = getUserRole();
    if (role !== 'manager') throw new Error('Only managers can create rent/bills');

    try {
      const billsRef = collection(db, 'households', household.id, 'rentBills');
      await addDoc(billsRef, {
        ...billData,
        householdId: household.id,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  };

  // Update rent/bill entry (manager only)
  const updateRentBill = async (billId, updates) => {
    if (!household) throw new Error('No household selected');
    const role = getUserRole();
    if (role !== 'manager') throw new Error('Only managers can update rent/bills');

    try {
      const billRef = doc(db, 'households', household.id, 'rentBills', billId);
      await updateDoc(billRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw error;
    }
  };

  // Delete rent/bill entry (manager only)
  const deleteRentBill = async (billId) => {
    if (!household) throw new Error('No household selected');
    const role = getUserRole();
    if (role !== 'manager') throw new Error('Only managers can delete rent/bills');

    try {
      const billRef = doc(db, 'households', household.id, 'rentBills', billId);
      await deleteDoc(billRef);
    } catch (error) {
      throw error;
    }
  };

  // Record payment (manager only)
  const recordPayment = async (billId, paymentAmount, notes = '', memberCategoryPayments = null) => {
    if (!household) throw new Error('No household selected');
    const role = getUserRole();
    if (role !== 'manager') throw new Error('Only managers can record payments');

    try {
      const bill = rentBills.find(b => b.id === billId);
      if (!bill) throw new Error('Bill not found');

      const totalAmount = bill.totalAmount || 0;
      const currentPaid = bill.paidAmount || 0;
      const newPaidAmount = currentPaid + paymentAmount;
      const newStatus = newPaidAmount >= totalAmount ? 'paid' : 
                        newPaidAmount > 0 ? 'partial' : 'unpaid';

      const updateData = {
        paidAmount: newPaidAmount,
        status: newStatus,
        lastPaymentDate: serverTimestamp(),
        lastPaymentAmount: paymentAmount,
        paymentNotes: notes,
        updatedAt: serverTimestamp()
      };

      // If memberCategoryPayments is provided, track individual payments
      if (memberCategoryPayments) {
        // Initialize or merge with existing payments
        const existingPayments = bill.memberCategoryPayments || {};
        const mergedPayments = { ...existingPayments };
        
        // Add new payments
        Object.entries(memberCategoryPayments).forEach(([memberId, categories]) => {
          if (!mergedPayments[memberId]) {
            mergedPayments[memberId] = {};
          }
          Object.entries(categories).forEach(([category, amount]) => {
            const numericAmount = parseFloat(amount) || 0;
            if (numericAmount > 0) {
              mergedPayments[memberId][category] = (mergedPayments[memberId][category] || 0) + numericAmount;
            }
          });
        });
        
        updateData.memberCategoryPayments = mergedPayments;
      }

      const billRef = doc(db, 'households', household.id, 'rentBills', billId);
      await updateDoc(billRef, updateData);
    } catch (error) {
      throw error;
    }
  };

  // Get rent/bills for a specific member
  const getMemberRentBills = (memberId) => {
    if (!memberId) return [];
    return rentBills.filter(bill => {
      // Check if member is in memberBreakdown
      if (bill.memberBreakdown && Array.isArray(bill.memberBreakdown)) {
        return bill.memberBreakdown.some(m => m.memberId === memberId);
      }
      // Fallback for old format
      return bill.memberId === memberId;
    });
  };

  // Get statistics
  const getStats = () => {
    const totalAmount = rentBills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
    const totalPaid = rentBills.reduce((sum, bill) => sum + (bill.paidAmount || 0), 0);
    const totalUnpaid = totalAmount - totalPaid;
    const unpaidCount = rentBills.filter(b => !b.status || b.status === 'unpaid').length;
    const partialCount = rentBills.filter(b => b.status === 'partial').length;
    const paidCount = rentBills.filter(b => b.status === 'paid').length;

    return {
      totalAmount,
      totalPaid,
      totalUnpaid,
      unpaidCount,
      partialCount,
      paidCount,
      totalBills: rentBills.length
    };
  };

  // Load data when household changes
  useEffect(() => {
    if (!household?.id) {
      setRentBillMembers([]);
      setRentBills([]);
      setLoading(false);
      return;
    }

    const householdId = household.id;

    // Listen to rent-only members
    const membersRef = collection(db, 'households', householdId, 'rentBillMembers');
    const unsubscribeMembers = onSnapshot(
      membersRef,
      (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRentBillMembers(membersData);
      },
      (error) => {
        setRentBillMembers([]);
      }
    );

    // Listen to rent/bills
    const billsRef = collection(db, 'households', householdId, 'rentBills');
    const unsubscribeBills = onSnapshot(
      billsRef,
      (snapshot) => {
        const billsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort by due date
        billsData.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        setRentBills(billsData);
      },
      (error) => {
        setRentBills([]);
      }
    );

    setLoading(false);

    return () => {
      unsubscribeMembers();
      unsubscribeBills();
    };
  }, [household]);

  const value = {
    rentBillMembers,
    rentBills,
    loading,
    isRentOnlyMember,
    addRentBillMember,
    updateRentBillMember,
    removeRentBillMember,
    createRentBill,
    updateRentBill,
    deleteRentBill,
    recordPayment,
    getMemberRentBills,
    getStats
  };

  return (
    <RentBillsContext.Provider value={value}>
      {children}
    </RentBillsContext.Provider>
  );
};

