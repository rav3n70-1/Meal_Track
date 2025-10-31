// Household Context for managing household data and members
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

const HouseholdContext = createContext();

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};

export const HouseholdProvider = ({ children }) => {
  const { currentUser, userProfile, loadUserProfile } = useAuth();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
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
        joinedAt: new Date().toISOString()
      });

      // Update user profile with household ID
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        householdId: householdRef.id
      });

      // Reload user profile
      await loadUserProfile(currentUser.uid);

      return householdRef.id;
    } catch (error) {
      console.error('Error creating household:', error);
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
      const membersRef = collection(db, 'households', householdId, 'members');
      const membersSnap = await getDocs(membersRef);
      
      if (membersSnap.size >= 10) {
        throw new Error('Household is full (maximum 10 members)');
      }

      // Add user as member
      const memberRef = doc(db, 'households', householdId, 'members', currentUser.uid);
      await setDoc(memberRef, {
        uid: currentUser.uid,
        name: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        role: 'member',
        joinedAt: new Date().toISOString()
      });

      // Update user profile with household ID
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        householdId: householdId
      });

      // Reload user profile
      await loadUserProfile(currentUser.uid);

      return householdId;
    } catch (error) {
      console.error('Error joining household:', error);
      throw error;
    }
  };

  // Get user's role in household
  const getUserRole = () => {
    if (!currentUser || !members.length) return null;
    const member = members.find(m => m.uid === currentUser.uid);
    return member?.role || null;
  };

  // Load household data
  useEffect(() => {
    if (!currentUser || !userProfile?.householdId) {
      setHousehold(null);
      setMembers([]);
      setExpenses([]);
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
    const unsubscribeMembers = onSnapshot(membersRef, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(membersData);
    });

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

    setLoading(false);

    return () => {
      unsubscribeHousehold();
      unsubscribeMembers();
      unsubscribeExpenses();
    };
  }, [currentUser, userProfile]);

  const value = {
    household,
    members,
    expenses,
    loading,
    createHousehold,
    joinHousehold,
    getUserRole
  };

  return (
    <HouseholdContext.Provider value={value}>
      {children}
    </HouseholdContext.Provider>
  );
};

