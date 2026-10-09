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
import { sendBillCreationWhatsApp, sendPaymentReceivedWhatsApp } from '../utils/whatsappService';

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
  const { household, getUserRole, members } = useHousehold();
  const [rentBillMembers, setRentBillMembers] = useState([]);
  const [rentBills, setRentBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get all members (household + rent-only)
  const getAllMembers = () => {
    return [
      ...members.map(m => ({ ...m, isRentOnly: false })),
      ...rentBillMembers.map(m => ({ ...m, isRentOnly: true }))
    ];
  };

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
        mobileNumber: memberData.mobileNumber || null,
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
      const billDocRef = await addDoc(billsRef, {
        ...billData,
        householdId: household.id,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send WhatsApp notifications to members with their individual amounts
      if (billData.memberCategoryAmounts) {
        const allMembers = getAllMembers();
        const membersWithAmounts = allMembers.filter(member => {
          const memberAmounts = billData.memberCategoryAmounts[member.uid];
          if (!memberAmounts) return false;
          const total = Object.values(memberAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
          return total > 0;
        });

        // Send WhatsApp to each member asynchronously (don't wait for all to complete)
        membersWithAmounts.forEach(async (member) => {
          try {
            const memberAmounts = billData.memberCategoryAmounts[member.uid];
            const memberTotal = Object.values(memberAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
            
            if (member.mobileNumber) {
              await sendBillCreationWhatsApp(member, { ...billData, id: billDocRef.id }, memberTotal);
            }
          } catch (error) {
            // Log error but don't fail bill creation if WhatsApp fails
            console.error(`Failed to send WhatsApp to ${member.name}:`, error);
          }
        });
      }
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
      // Find current bill from state (fallback: allow partial updates)
      const current = rentBills.find(b => b.id === billId) || {};

      // Determine new total amount: prefer explicit, else recompute from memberCategoryAmounts/categories when provided
      let newTotalAmount = typeof updates.totalAmount !== 'undefined' ? (parseFloat(updates.totalAmount) || 0) : (current.totalAmount || 0);
      const effectiveMemberAmounts = updates.memberCategoryAmounts || current.memberCategoryAmounts || {};
      const effectiveCategories = updates.categories || current.categories || [];
      if (updates.memberCategoryAmounts && effectiveCategories.length > 0) {
        // Recompute from new matrix
        newTotalAmount = effectiveCategories.reduce((sumCat, cat) => {
          const perMember = Object.values(effectiveMemberAmounts).reduce((sumMem, m) => sumMem + (parseFloat(m?.[cat]) || 0), 0);
          return sumCat + perMember;
        }, 0);
      }

      // Merge existing payments and clamp them against new dues per member/category
      const existingPayments = current.memberCategoryPayments || {};
      const mergedPayments = {};
      Object.entries(effectiveMemberAmounts).forEach(([memberId, catMap]) => {
        mergedPayments[memberId] = {};
        effectiveCategories.forEach((cat) => {
          const due = parseFloat(catMap?.[cat]) || 0;
          const paid = parseFloat(existingPayments?.[memberId]?.[cat]) || 0;
          // Clamp payment to new due
          const clamped = Math.max(0, Math.min(paid, due));
          if (clamped > 0) mergedPayments[memberId][cat] = clamped;
        });
      });

      // Recalculate paid amount and status
      const recalculatedPaidAmount = Object.values(mergedPayments).reduce((sumMem, catMap) => {
        return sumMem + Object.values(catMap).reduce((s, v) => s + (parseFloat(v) || 0), 0);
      }, 0);

      let newStatus = 'unpaid';
      if (recalculatedPaidAmount >= newTotalAmount - 0.01 && newTotalAmount > 0) {
        newStatus = 'paid';
      } else if (recalculatedPaidAmount > 0) {
        newStatus = 'partial';
      }

      const billRef = doc(db, 'households', household.id, 'rentBills', billId);
      await updateDoc(billRef, {
        ...updates,
        totalAmount: newTotalAmount,
        memberCategoryPayments: mergedPayments,
        paidAmount: recalculatedPaidAmount,
        status: newStatus,
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

        // Send WhatsApp notifications to members who made payments
        const allMembers = getAllMembers();

        Object.entries(memberCategoryPayments).forEach(async ([memberId, categories]) => {
          try {
            const member = allMembers.find(m => m.uid === memberId);
            if (!member || !member.mobileNumber) return;

            // Calculate total payment for this member
            const memberPaymentTotal = Object.values(categories).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);
            if (memberPaymentTotal <= 0) return;

            // Calculate member's total due amount
            const memberAmounts = bill.memberCategoryAmounts?.[memberId] || {};
            const memberTotalDue = Object.values(memberAmounts).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);

            // Calculate existing payments for this member (before this payment)
            const existingMemberPayments = bill.memberCategoryPayments?.[memberId] || {};
            const existingPaid = Object.values(existingMemberPayments).reduce((sum, amt) => sum + (parseFloat(amt) || 0), 0);

            // Calculate new total paid (existing + new payment)
            const newTotalPaid = existingPaid + memberPaymentTotal;

            // Determine payment status
            const paymentStatus = newTotalPaid >= memberTotalDue - 0.01 ? 'full' : 'partial';
            const remainingAmount = Math.max(0, memberTotalDue - newTotalPaid);

            // Send WhatsApp notification
            await sendPaymentReceivedWhatsApp(member, bill, memberPaymentTotal, paymentStatus, remainingAmount);
          } catch (error) {
            // Log error but don't fail payment recording if WhatsApp fails
            console.error(`Failed to send payment WhatsApp to member ${memberId}:`, error);
          }
        });
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

