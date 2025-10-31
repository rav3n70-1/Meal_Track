// Login page with Google Sign-In
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase/config';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Loading from '../components/ui/Loading';
import toast from 'react-hot-toast';

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  // Check for redirect result on mount (for mobile OAuth)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User just completed OAuth redirect
          toast.success('Welcome! Setting up your account...');
        }
      } catch (error) {
        console.error('Redirect error:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
          toast.error('Sign in failed. Please try again.');
        }
      } finally {
        setCheckingRedirect(false);
      }
    };

    checkRedirect();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // On mobile, signInWithRedirect will redirect away from this page
      // On desktop, popup completes and auth state updates
      // In both cases, auth state change will handle routing
      toast.success('Welcome! Setting up your account...');
    } catch (error) {
      console.error('Login error:', error);
      // Only show error and reset loading if it's not a redirect
      if (error.code !== 'auth/cancelled-popup-request' && 
          error.code !== 'auth/popup-closed-by-user') {
        toast.error('Failed to sign in. Please try again.');
        setLoading(false);
      }
    }
  };

  // Show loading while checking for redirect
  if (checkingRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10">
        <Loading text="Checking authentication..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary text-primary-foreground rounded-2xl mb-4 shadow-lg"
          >
            <span className="text-6xl font-bold">৳</span>
          </motion.div>
          <h1 className="text-4xl font-bold mb-2">Meal Tracker</h1>
          <p className="text-muted-foreground">
            Track and manage shared meal expenses with your household
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Welcome!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full"
                size="lg"
                icon={<LogIn size={20} />}
              >
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Sign in to create or join a household</p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          <p className="mb-2">✨ Features</p>
          <ul className="space-y-1">
            <li>📊 Track shared meal expenses</li>
            <li>👥 Manage up to 10 household members</li>
            <li>💰 Automatic balance calculations</li>
            <li>📱 Works on mobile and desktop</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;

