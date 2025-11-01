// Main Application Component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
import { PersonalExpenseProvider } from './context/PersonalExpenseContext';
import { RentBillsProvider } from './context/RentBillsContext';

// Components
import AuthHandler from './components/AuthHandler';

// Pages
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Expenses from './pages/Expenses';
import Debts from './pages/Debts';
import RentBills from './pages/RentBills';
import Members from './pages/Members';
import Reports from './pages/Reports';
import Activity from './pages/Activity';
import Settings from './pages/Settings';
import PersonalExpenses from './pages/PersonalExpenses';

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Protected Route - Only for authenticated users
const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Not authenticated - redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but no household - redirect to setup (except if already on setup page)
  if (!userProfile?.householdId && window.location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  // Has household but trying to access setup - redirect to dashboard
  if (userProfile?.householdId && window.location.pathname === '/setup') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route - Only for non-authenticated users
const PublicRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  // Already authenticated - redirect based on household status
  if (currentUser) {
    const destination = userProfile?.householdId ? '/dashboard' : '/setup';
    return <Navigate to={destination} replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AuthHandler>
            <HouseholdProvider>
              <PersonalExpenseProvider>
                <RentBillsProvider>
                  <Router>
                  <Routes>
                  {/* Public Route - Login */}
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } 
                  />

                  {/* Protected Route - Setup */}
                  <Route 
                    path="/setup" 
                    element={
                      <ProtectedRoute>
                        <Setup />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected Routes - Main App */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/expenses" 
                    element={
                      <ProtectedRoute>
                        <Expenses />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                  path="/debts" 
                  element={
                    <ProtectedRoute>
                      <Debts />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/rent-bills" 
                  element={
                    <ProtectedRoute>
                      <RentBills />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/members"
                    element={
                      <ProtectedRoute>
                        <Members />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/activity" 
                    element={
                      <ProtectedRoute>
                        <Activity />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/personal-expenses" 
                    element={
                      <ProtectedRoute>
                        <PersonalExpenses />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Root Route */}
                  <Route 
                    path="/" 
                    element={
                      <ProtectedRoute>
                        <Navigate to="/dashboard" replace />
                      </ProtectedRoute>
                    } 
                  />

                  {/* 404 Route */}
                  <Route 
                    path="*" 
                    element={
                      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10">
                        <div className="text-center">
                          <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
                          <p className="text-2xl text-muted-foreground mb-8">Oops! Page not found</p>
                          <a 
                            href="/" 
                            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Go back home
                          </a>
                        </div>
                      </div>
                    } 
                  />
                </Routes>
                </Router>

                {/* Toast Notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                    },
                    success: {
                      iconTheme: {
                        primary: '#10b981',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#ffffff',
                      },
                    },
                    loading: {
                      iconTheme: {
                        primary: '#3b82f6',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
              </RentBillsProvider>
              </PersonalExpenseProvider>
            </HouseholdProvider>
          </AuthHandler>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
