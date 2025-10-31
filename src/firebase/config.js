// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVgLLM19SnoBY50ZMDQC5Kan5p0Sr2aec",
  authDomain: "meal-tracker-11262.firebaseapp.com",
  projectId: "meal-tracker-11262",
  storageBucket: "meal-tracker-11262.firebasestorage.app",
  messagingSenderId: "989360320237",
  appId: "1:989360320237:web:23e6020552a74d03dfa6e4",
  measurementId: "G-M67VFT7ZVM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
  display: 'popup'
});

// Set persistence to local (survives browser restarts)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('[Firebase] Auth persistence set to LOCAL');
  })
  .catch((error) => {
    console.error('[Firebase] Error setting persistence:', error);
  });

export default app;
