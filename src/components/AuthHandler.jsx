// Authentication Handler Component
// Provides a loading screen while authentication state is being determined
import React from 'react';
import { useAuth } from '../context/AuthContext';
import Loading from './ui/Loading';

const AuthHandler = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10">
        <div className="text-center">
          <Loading text="Loading your account..." />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthHandler;
