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
        console.log('[Auth] New user profile created');
      } else {
        // Existing user - update last login
        await setDoc(userRef, userData, { merge: true });
        console.log('[Auth] User profile updated');
      }

      // Fetch and return the profile
      const updatedSnap = await getDoc(userRef);
      return updatedSnap.data();
    } catch (error) {
      console.error('[Auth] Error creating/updating user profile:', error);
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
      console.error('[Auth] Error loading user profile:', error);
      return null;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const isMobile = isMobileDevice();

      console.log('[Auth] Starting Google sign-in', { isMobile });

      if (isMobile) {
        // Use redirect flow for mobile (better compatibility)
        await signInWithRedirect(auth, googleProvider);
        // Note: signInWithRedirect will redirect away from the page
        // The result will be handled in the redirect effect below
      } else {
        // Use popup flow for desktop (better UX)
        const result = await signInWithPopup(auth, googleProvider);
        
        if (result.user) {
          console.log('[Auth] Popup sign-in successful');
          const profile = await createOrUpdateUserProfile(result.user);
          setUserProfile(profile);
          setCurrentUser(result.user);
        }
      }
    } catch (error) {
      console.error('[Auth] Sign-in error:', error);
      setLoading(false);
      
      // Handle specific errors
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
      console.log('[Auth] Signing out...');
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      console.log('[Auth] Sign-out successful');
    } catch (error) {
      console.error('[Auth] Sign-out error:', error);
      throw error;
    }
  };

  // Handle redirect result (for mobile OAuth)
  useEffect(() => {
    let mounted = true;

    const handleRedirect = async () => {
      try {
        console.log('[Auth] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result && result.user && mounted) {
          console.log('[Auth] Redirect sign-in successful');
          const profile = await createOrUpdateUserProfile(result.user);
          if (mounted) {
            setUserProfile(profile);
            setCurrentUser(result.user);
          }
        }
      } catch (error) {
        console.error('[Auth] Redirect error:', error);
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    handleRedirect();

    return () => {
      mounted = false;
    };
  }, []);

  // Listen to authentication state changes
  useEffect(() => {
    console.log('[Auth] Setting up auth state listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[Auth] Auth state changed:', { 
        hasUser: !!user, 
        email: user?.email 
      });

      if (user) {
        // User is signed in
        setCurrentUser(user);
        await loadUserProfile(user.uid);
      } else {
        // User is signed out
        setCurrentUser(null);
        setUserProfile(null);
      }

      setLoading(false);
      setInitializing(false);
    });

    return () => {
      console.log('[Auth] Cleaning up auth state listener');
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
