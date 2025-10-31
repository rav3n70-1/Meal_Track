// Authentication state handler component
// This ensures auth state is properly loaded before rendering routes
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from './ui/Loading';

const AuthHandler = ({ children }) => {
  const { loading: authLoading } = useAuth();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Give auth state time to initialize
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (authLoading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loading text="Initializing..." />
      </div>
    );
  }

  return children;
};

export default AuthHandler;

