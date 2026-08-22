// Household Context for managing household data and members
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';
import { updateAutomaticDebts } from '../utils/debtGeneration';
import { processDueRecurringExpenses } from '../utils/recurringExpenses';

const HouseholdContext = createContext();

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};

export const HouseholdProvider = ({ children }) => {
  console.log('[Debug] HouseholdProvider rendering...');
  const { currentUser, userProfile, loadUserProfile } = useAuth();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate unique household invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create new household
  const createHousehold = async (householdName) => {
    if (!currentUser) throw new Error('User must be logged in');

    try {
      const householdRef = doc(collection(db, 'households'));
      const inviteCode = generateInviteCode();

      const householdData = {
        id: householdRef.id,
        name: householdName,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        inviteCode: inviteCode
      };

      // Create household document
      await setDoc(householdRef, householdData);

      // Create manager member document
      const memberRef = doc(db, 'households', householdRef.id, 'members', currentUser.uid);
      await setDoc(memberRef, {
        uid: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        role: 'manager',
        joinedAt: new Date().toISOString(),
        householdId: householdRef.id,
        householdName: householdName
      });

      // Update user profile with household ID
      const userRef = doc(db, 'users', currentUser.uid);

      // Check if user document exists first
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          householdId: householdRef.id
        });
      } else {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: new Date().toISOString(),
          householdId: householdRef.id
        });
      }

      // Reload user profile
      await loadUserProfile(currentUser.uid);

      return householdRef.id;
    } catch (error) {
      throw error;
    }
  };

  // Join existing household with invite code
  const joinHousehold = async (inviteCode) => {
    if (!currentUser) throw new Error('User must be logged in');

    try {
      // Find household with invite code
      const householdsRef = collection(db, 'households');
      const q = query(householdsRef, where('inviteCode', '==', inviteCode.toUpperCase()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid invite code');
      }

      const householdDoc = querySnapshot.docs[0];
      const householdId = householdDoc.id;

      // Check if household is full (max 10 members)
      // NOTE: Removed this check because non-members cannot read the members list due to security rules.
      // If we need this limit, it should be enforced via Cloud Functions or by adding a memberCount field to the household doc.
      /*
      const membersRef = collection(db, 'households', householdId, 'members');
      const membersSnap = await getDocs(membersRef);
      
      if (membersSnap.size >= 10) {
        throw new Error('Household is full (maximum 10 members)');
      }
      */

      // Add user as member
      const memberRef = doc(db, 'households', householdId, 'members', currentUser.uid);
      await setDoc(memberRef, {
        uid: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        role: 'member',
        joinedAt: new Date().toISOString(),
        householdId: householdId,
        householdName: householdDoc.data().name || 'Household'
      });

      // Update user profile with household ID
      const userRef = doc(db, 'users', currentUser.uid);

      // Check if user document exists first
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          householdId: householdId
        });
      } else {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
          createdAt: new Date().toISOString(),
          householdId: householdId
        });
      }

      // Reload user profile
      await loadUserProfile(currentUser.uid);

      return householdId;
    } catch (error) {
      throw error;
    }
  };

  // Get user's role in household
  const getUserRole = () => {
    if (!currentUser || !members.length) return null;
    const member = members.find(m => m.uid === currentUser.uid);
    return member?.role || null;
  };

  // Update member information (manager only)
  const updateMember = async (memberId, updates) => {
    if (!currentUser || !household) throw new Error('Not authorized');

    const role = getUserRole();
    if (role !== 'manager' && currentUser.uid !== memberId) {
      throw new Error('Only managers can update other members');
    }

    try {
      const memberRef = doc(db, 'households', household.id, 'members', memberId);
      await updateDoc(memberRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      throw error;
    }
  };

  // Remove member from household (manager only)
  const removeMember = async (memberId) => {
    if (!currentUser || !household) throw new Error('Not authorized');

    const role = getUserRole();
    if (role !== 'manager') {
      throw new Error('Only managers can remove members');
    }

    // Prevent removing yourself
    if (memberId === currentUser.uid) {
      throw new Error('You cannot remove yourself from the household');
    }

    // Prevent removing if it's the last manager
    const managers = members.filter(m => m.role === 'manager');
    const memberToRemove = members.find(m => m.uid === memberId);
    if (managers.length === 1 && memberToRemove?.role === 'manager') {
      throw new Error('Cannot remove the last manager. Assign another manager first.');
    }

    try {
      const memberRef = doc(db, 'households', household.id, 'members', memberId);
      await deleteDoc(memberRef);

      // Try to update user profile to remove household ID
      // This may fail due to permissions (only users can update their own profile)
      // but that's okay - the member is already removed from the household
      try {
        const userRef = doc(db, 'users', memberId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          await updateDoc(userRef, {
            householdId: null
          });
        }
      } catch (userUpdateError) {
        // Silently fail - user will see they're removed when they reload
        // They can rejoin another household if needed
      }
    } catch (error) {
      throw error;
    }
  };

  // Load household data
  useEffect(() => {
    if (!currentUser || !userProfile?.householdId) {
      setHousehold(null);
      setMembers([]);
      setExpenses([]);
      setDebts([]);
      setLoading(false);
      return;
    }

    const householdId = userProfile.householdId;

    // Listen to household changes
    const householdRef = doc(db, 'households', householdId);
    const unsubscribeHousehold = onSnapshot(householdRef, (doc) => {
      if (doc.exists()) {
        setHousehold({ id: doc.id, ...doc.data() });
      }
    });

    // Listen to members changes
    const membersRef = collection(db, 'households', householdId, 'members');
    const unsubscribeMembers = onSnapshot(
      membersRef,
      (snapshot) => {
        const membersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(membersData);

        // Check if current user is still a member
        const isStillMember = membersData.some(m => m.uid === currentUser.uid);
        if (!isStillMember) {
          // User has been removed from household - clear their householdId
          const userRef = doc(db, 'users', currentUser.uid);
          updateDoc(userRef, { householdId: null }).catch(() => { });
          // Reload user profile to reflect the change
          loadUserProfile(currentUser.uid);
        }
      },
      (error) => {
        // If we get a permission error, user might have been removed
        if (error.code === 'permission-denied') {
          const userRef = doc(db, 'users', currentUser.uid);
          updateDoc(userRef, { householdId: null }).catch(() => { });
          loadUserProfile(currentUser.uid);
        }
      }
    );

    // Listen to expenses changes
    const expensesRef = collection(db, 'households', householdId, 'expenses');
    const unsubscribeExpenses = onSnapshot(expensesRef, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date descending
      expensesData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setExpenses(expensesData);
    });

    // Listen to debts changes
    const debtsRef = collection(db, 'households', householdId, 'debts');
    const unsubscribeDebts = onSnapshot(debtsRef, (snapshot) => {
      const debtsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by date descending
      debtsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setDebts(debtsData);
    });

    // Listen to recurring expenses
    const recurringRef = collection(db, 'households', householdId, 'recurringExpenses');
    const unsubscribeRecurring = onSnapshot(recurringRef, (snapshot) => {
      const recurringData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort active ones first, then by nextDueDate
      recurringData.sort((a, b) => {
        if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
        return new Date(a.nextDueDate) - new Date(b.nextDueDate);
      });
      setRecurringExpenses(recurringData);
      
      // Trigger automation engine whenever recurring expenses change (or load initially)
      if (currentUser) {
        processDueRecurringExpenses(householdId, currentUser);
      }
    });

    setLoading(false);

    return () => {
      unsubscribeHousehold();
      unsubscribeMembers();
      unsubscribeExpenses();
      unsubscribeDebts();
      unsubscribeRecurring();
    };
  }, [currentUser, userProfile]);

  // Auto-generate debts from expenses whenever expenses or members change
  useEffect(() => {
    console.log('[Debug] Debt generation effect triggered');
    console.log('[Debug] Inputs:', {
      expensesCount: expenses?.length,
      membersCount: members?.length,
      expensesHash: expenses?.map(e => e.id).join(','),
      membersHash: members?.map(m => m.uid).join(',')
    });

    if (!household || !members.length) {
      console.log('[Debug] Skipping: Missing household or members');
      return;
    }

    const generateDebts = async () => {
      try {
        console.log('[Debug] Calling updateAutomaticDebts...');
        await updateAutomaticDebts(household.id, expenses, members, debts);
        console.log('[Debug] updateAutomaticDebts completed');
      } catch (error) {
        console.error('[Debug] Error in generateDebts:', error);
      }
    };

    // Add a small delay to avoid too many writes
    const timeoutId = setTimeout(generateDebts, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, members]);

  // Manual function to recalculate debts (can be called explicitly after expense deletion)
  const recalculateDebts = async () => {
    if (!household || !members.length) return;

    try {
      await updateAutomaticDebts(household.id, expenses, members, debts);
    } catch (error) {
      console.error('Error recalculating debts:', error);
      throw error;
    }
  };

  // Delete household
  const deleteHousehold = async () => {
    if (!household || !currentUser) return;
    try {
      const userRole = getUserRole();
      if (userRole !== 'manager') {
        throw new Error('Only managers can delete the household');
      }
      
      const householdId = household.id;
      
      // 1. Delete household document FIRST so the security rules (which check member docs) still pass
      await deleteDoc(doc(db, 'households', householdId));
      
      // 2. Delete all member docs EXCEPT the current user's
      const membersRef = collection(db, 'households', householdId, 'members');
      const snapshot = await getDocs(membersRef);
      
      const otherMembers = snapshot.docs.filter(docSnap => docSnap.id !== currentUser.uid);
      const deletePromises = otherMembers.map(docSnap => deleteDoc(doc(db, 'households', householdId, 'members', docSnap.id)));
      await Promise.all(deletePromises);

      // 3. Delete the current user's member doc LAST (this removes their manager status for any further queries)
      await deleteDoc(doc(db, 'households', householdId, 'members', currentUser.uid));
      
      // Clear current user's profile householdId if it matches
      if (userProfile?.householdId === householdId) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, { householdId: null });
        loadUserProfile(currentUser.uid);
      }
      
    } catch (error) {
      console.error('Error deleting household:', error);
      throw error;
    }
  };

  const value = {
    household,
    members,
    expenses,
    debts,
    recurringExpenses,
    loading,
    createHousehold,
    joinHousehold,
    getUserRole,
    updateMember,
    removeMember,
    recalculateDebts,
    deleteHousehold
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};

