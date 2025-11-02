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
      console.log('[POPUP DEBUG] Starting sign-in process...');
      console.log('[POPUP DEBUG] Current URL:', window.location.href);
      console.log('[POPUP DEBUG] Current pathname:', window.location.pathname);
      setLoading(true);
      const isMobile = isMobileDevice();
      console.log('[POPUP DEBUG] Is mobile device:', isMobile);

      if (isMobile) {
        // Use redirect flow for mobile (better compatibility)
        console.log('[POPUP DEBUG] Using redirect flow for mobile');
        console.log('[POPUP DEBUG] Current origin:', window.location.origin);
        await signInWithRedirect(auth, googleProvider);
        console.log('[POPUP DEBUG] Redirect initiated - page will redirect');
        // Note: signInWithRedirect will redirect away from the page
        // The result will be handled in the redirect effect below
      } else {
        // Use popup flow for desktop (better UX)
        console.log('[POPUP DEBUG] Using popup flow for desktop');
        console.log('[POPUP DEBUG] Creating popup window...');
        console.log('[POPUP DEBUG] Current window location:', {
          href: window.location.href,
          origin: window.location.origin,
          pathname: window.location.pathname
        });
        
        // Add listener to detect popup URL changes (if possible)
        const popupWindowCheck = setInterval(() => {
          // This runs in the main window, not the popup
          // We can't directly access popup location due to CORS, but we can log when popup closes
        }, 1000);
        
        try {
          const result = await signInWithPopup(auth, googleProvider);
          clearInterval(popupWindowCheck);
          
          console.log('[POPUP DEBUG] Popup result received:', {
            hasUser: !!result?.user,
            userEmail: result?.user?.email,
            userUid: result?.user?.uid,
            operationType: result?.operationType,
            providerId: result?.providerId
          });
          console.log('[POPUP DEBUG] Current URL after popup:', window.location.href);
          console.log('[POPUP DEBUG] Popup window closed, processing result...');
          
          if (result.user) {
            console.log('[POPUP DEBUG] Creating/updating user profile...');
            const profile = await createOrUpdateUserProfile(result.user);
            console.log('[POPUP DEBUG] Profile created/updated:', {
              hasProfile: !!profile,
              hasHouseholdId: !!profile?.householdId,
              householdId: profile?.householdId
            });
            setUserProfile(profile);
            setCurrentUser(result.user);
            console.log('[POPUP DEBUG] User state updated. Current URL:', window.location.href);
            console.log('[POPUP DEBUG] Expected to redirect to:', profile?.householdId ? '/dashboard' : '/setup');
          }
        } catch (popupError) {
          clearInterval(popupWindowCheck);
          throw popupError;
        }
      }
    } catch (error) {
      console.error('[POPUP DEBUG] Sign-in error:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        currentUrl: window.location.href
      });
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
      await firebaseSignOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    }
  };

  // Handle redirect result (for mobile OAuth)
  useEffect(() => {
    let mounted = true;

    const handleRedirect = async () => {
      try {
        console.log('[REDIRECT DEBUG] Checking for redirect result...');
        console.log('[REDIRECT DEBUG] Current URL:', window.location.href);
        console.log('[REDIRECT DEBUG] Current pathname:', window.location.pathname);
        console.log('[REDIRECT DEBUG] Search params:', window.location.search);
        const result = await getRedirectResult(auth);
        console.log('[REDIRECT DEBUG] Redirect result:', {
          hasResult: !!result,
          hasUser: !!result?.user,
          userEmail: result?.user?.email,
          userUid: result?.user?.uid
        });
        
        if (result && result.user && mounted) {
          console.log('[REDIRECT DEBUG] Processing redirect result...');
          const profile = await createOrUpdateUserProfile(result.user);
          console.log('[REDIRECT DEBUG] Profile:', {
            hasProfile: !!profile,
            hasHouseholdId: !!profile?.householdId,
            householdId: profile?.householdId
          });
          if (mounted) {
            setUserProfile(profile);
            setCurrentUser(result.user);
            console.log('[REDIRECT DEBUG] User state updated');
            console.log('[REDIRECT DEBUG] Expected redirect to:', profile?.householdId ? '/dashboard' : '/setup');
          }
        } else {
          console.log('[REDIRECT DEBUG] No redirect result or user');
        }
      } catch (error) {
        console.error('[REDIRECT DEBUG] Redirect error:', {
          code: error.code,
          message: error.message,
          stack: error.stack,
          currentUrl: window.location.href
        });
      } finally {
        if (mounted) {
          setInitializing(false);
          console.log('[REDIRECT DEBUG] Initialization complete');
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
