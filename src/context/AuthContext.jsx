// Authentication Context Provider
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

  // Handle redirect result (for mobile OAuth)
  useEffect(() => {
    // This effect is intentionally left blank.
    // The redirect logic has been removed in favor of a consistent popup flow.
    // We keep the initializing state logic to prevent race conditions on initial load.
    setInitializing(false);
  }, []);

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
      }

      setLoading(false);
      setInitializing(false);
      console.log('[AUTH STATE DEBUG] Auth state update complete. Current URL:', window.location.href);
    });

    return () => {
      console.log('[AUTH STATE DEBUG] Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading: loading || initializing,
    signInWithGoogle,
    signOut,
    loadUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
