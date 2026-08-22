// Authentication Context Provider
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collectionGroup, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase/config';

const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userHouseholds, setUserHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Detect if user is on mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Create or update user profile in Firestore
  const createOrUpdateUserProfile = async (user) => {
    if (!user) return null;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        photoURL: user.photoURL || null,
        lastLogin: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        // New user - create profile
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          householdId: null,
        });
      } else {
        // Existing user - update last login
        await setDoc(userRef, userData, { merge: true });
      }

      // Fetch and return the profile
      const updatedSnap = await getDoc(userRef);
      return updatedSnap.data();
    } catch (error) {
      throw error;
    }
  };

  // Load user profile from Firestore
  const loadUserProfile = async (uid) => {
    if (!uid) {
      setUserProfile(null);
      return null;
    }

    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const profile = userSnap.data();
        setUserProfile(profile);
        return profile;
      } else {
        // Profile doesn't exist, create it
        const user = auth.currentUser;
        if (user) {
          const newProfile = await createOrUpdateUserProfile(user);
          setUserProfile(newProfile);
          return newProfile;
        }
      }
    } catch (error) {
      return null;
    }
  };

  // Switch active household
  const switchHousehold = async (householdId) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { householdId });
      await loadUserProfile(currentUser.uid);
    } catch (error) {
      console.error('Failed to switch household:', error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      // Always use popup flow for simplicity and consistency
      const result = await signInWithPopup(auth, googleProvider);
      
      if (result.user) {
        const profile = await createOrUpdateUserProfile(result.user);
        setUserProfile(profile);
        setCurrentUser(result.user);
      }
    } catch (error) {
      console.error('[SIGN_IN_ERROR]', error);
      setLoading(false);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up blocked. Please allow pop-ups for this site.');
      } else {
        throw error;
      }
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    console.log('[AUTH STATE DEBUG] Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[AUTH STATE DEBUG] Auth state changed:', {
        hasUser: !!user,
        userEmail: user?.email,
        userUid: user?.uid,
        currentUrl: window.location.href,
        currentPathname: window.location.pathname
      });
      
      if (user) {
        // User is signed in
        console.log('[AUTH STATE DEBUG] User signed in, loading profile...');
        setCurrentUser(user);
        const profile = await loadUserProfile(user.uid);
        console.log('[AUTH STATE DEBUG] Profile loaded:', {
          hasProfile: !!profile,
          hasHouseholdId: !!profile?.householdId,
          householdId: profile?.householdId
        });
      } else {
        // User is signed out
        console.log('[AUTH STATE DEBUG] User signed out');
        setCurrentUser(null);
        setUserProfile(null);
        setUserHouseholds([]);
      }

      setLoading(false);
      setInitializing(false);
      console.log('[AUTH STATE DEBUG] Auth state update complete. Current URL:', window.location.href);
    });

    let unsubscribeHouseholds = () => {};

    if (currentUser) {
      // Listen to all households the user is a member of
      const membersGroupQuery = query(
        collectionGroup(db, 'members'),
        where('uid', '==', currentUser.uid)
      );

      unsubscribeHouseholds = onSnapshot(membersGroupQuery, (snapshot) => {
        const households = snapshot.docs.map(doc => {
          const data = doc.data();
          // Backward compatibility for existing member docs
          const hId = data.householdId || doc.ref.parent.parent.id;
          
          if (!data.householdName && doc.ref.parent.parent) {
            // Auto-migrate old documents in the background
            getDoc(doc.ref.parent.parent).then(snap => {
              if (snap.exists()) {
                updateDoc(doc.ref, { 
                  householdName: snap.data().name || 'Household', 
                  householdId: snap.id 
                }).catch(() => {});
              }
            }).catch(() => {});
          }

          return {
            householdId: hId,
            householdName: data.householdName || 'Household',
            role: data.role,
            joinedAt: data.joinedAt
          };
        }).filter(h => h.householdId); // Ensure valid docs

        setUserHouseholds(households);
      }, (error) => {
        console.error('Error fetching user households:', error);
      });
    }

    return () => {
      console.log('[AUTH STATE DEBUG] Cleaning up auth state listener');
      unsubscribe();
      unsubscribeHouseholds();
    };
  }, [currentUser?.uid]); // Only re-run when user changes

  // Auto-switch logic: if profile is loaded and they have households, but no valid active one
  useEffect(() => {
    if (userProfile && userHouseholds.length > 0) {
      if (!userProfile.householdId) {
        console.log('[AUTH STATE DEBUG] Active household is null, auto-switching to first available.');
        switchHousehold(userHouseholds[0].householdId);
      } else {
        const activeStillExists = userHouseholds.some(h => h.householdId === userProfile.householdId);
        if (!activeStillExists) {
          console.log('[AUTH STATE DEBUG] Active household removed, auto-switching to next available.');
          switchHousehold(userHouseholds[0].householdId);
        }
      }
    }
  }, [userProfile, userHouseholds]); // Re-run when either state updates

  const value = {
    currentUser,
    userProfile,
    userHouseholds,
    loading: loading || initializing,
    signInWithGoogle,
    signOut,
    loadUserProfile,
    switchHousehold,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
