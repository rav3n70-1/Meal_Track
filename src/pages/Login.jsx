// Login Page Component
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Utensils, Users, TrendingUp, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import toast from 'react-hot-toast';

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      toast.success('Welcome! Setting up your account...');
    } catch (error) {
      console.error('[Login] Error:', error);
      
      // User-friendly error messages
      if (error.message === 'Sign-in cancelled') {
        toast.error('Sign-in was cancelled');
      } else if (error.message.includes('popup')) {
        toast.error('Please enable pop-ups for this site');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-4">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding & Features */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center lg:text-left"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 bg-primary text-primary-foreground rounded-3xl mb-6 shadow-2xl"
          >
            <span className="text-6xl font-bold">৳</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Meal Tracker
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            The smart way to track and manage shared meal expenses with your household
          </p>

          {/* Features */}
          <div className="space-y-4">
            <FeatureItem 
              icon={<Utensils className="w-6 h-6" />}
              title="Track Meals"
              description="Log daily meals and expenses effortlessly"
            />
            <FeatureItem 
              icon={<Users className="w-6 h-6" />}
              title="Manage Members"
              description="Add up to 10 household members"
            />
            <FeatureItem 
              icon={<TrendingUp className="w-6 h-6" />}
              title="Auto Calculate"
              description="Automatic balance calculations and settlements"
            />
            <FeatureItem 
              icon={<Smartphone className="w-6 h-6" />}
              title="Mobile Ready"
              description="Works perfectly on all devices"
            />
          </div>
        </motion.div>

        {/* Right Side - Login Card */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Welcome Back!</CardTitle>
              <CardDescription className="text-base mt-2">
                Sign in to access your household meal tracker
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Google Sign In Button */}
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-14 text-lg"
                size="lg"
                icon={<LogIn size={24} />}
              >
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </Button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">
                    Secure authentication via Google
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-center text-muted-foreground">
                  By signing in, you can create or join a household to start tracking meals together
                </p>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <BenefitBadge emoji="🔒" text="Secure" />
                <BenefitBadge emoji="⚡" text="Fast" />
                <BenefitBadge emoji="📱" text="Mobile" />
                <BenefitBadge emoji="🆓" text="Free" />
              </div>
            </CardContent>
          </Card>

          {/* Footer Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-muted-foreground mt-6"
          >
            New here? Sign in to create your first household
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

// Feature Item Component
const FeatureItem = ({ icon, title, description }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="flex items-start space-x-4"
  >
    <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

// Benefit Badge Component
const BenefitBadge = ({ emoji, text }) => (
  <div className="flex items-center justify-center space-x-2 bg-background border border-border rounded-lg py-3">
    <span className="text-2xl">{emoji}</span>
    <span className="font-medium">{text}</span>
  </div>
);

export default Login;
