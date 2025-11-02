// Main Application Component
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

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

// OAuth Handler Component for Firebase popup callbacks
const OAuthHandler = () => {
  React.useEffect(() => {
    const isPopup = window.opener !== null;
    const url = window.location.href;
    const search = window.location.search;
    const pathname = window.location.pathname;
    
    console.log('[POPUP HANDLER] OAuth Handler Component Mounted', {
      isPopup: isPopup,
      url: url,
      pathname: pathname,
      search: search,
      hasStateParam: search.includes('state='),
      hasCodeParam: search.includes('code='),
      hasErrorParam: search.includes('error='),
      openerIsNull: window.opener === null,
      openerExists: window.opener !== null
    });
    
    // If this is NOT a popup, it might be a redirect (mobile flow)
    // For redirect flows, Firebase Auth will handle it via getRedirectResult in AuthContext
    if (!isPopup) {
      console.log('[POPUP HANDLER] Not a popup window - this might be a redirect flow');
      return;
    }
    
    // Check for error parameters in the URL
    const urlParams = new URLSearchParams(search);
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (errorParam) {
      console.error('[POPUP HANDLER] OAuth error detected:', {
        error: errorParam,
        description: errorDescription,
        fullUrl: url
      });
      
      // Notify parent window of error
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({ 
            type: 'AUTH_ERROR', 
            error: errorParam,
            description: errorDescription
          }, '*');
        }
      } catch (e) {
        console.error('[POPUP HANDLER] Could not send error message to parent:', e);
      }
      
      // Close popup after a delay
      setTimeout(() => {
        if (!window.closed) {
          window.close();
        }
      }, 2000);
      return;
    }
    
    // For popup windows, Firebase should automatically process the OAuth callback
    // We monitor the auth state to detect when authentication completes
    let authStateChecked = false;
    let timeoutId = null;
    
    // Check current auth state immediately
    const currentUser = auth.currentUser;
    console.log('[POPUP HANDLER] Initial auth state check:', {
      hasCurrentUser: !!currentUser,
      userEmail: currentUser?.email
    });
    
    // Monitor auth state changes in the popup
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('[POPUP HANDLER] Auth state changed in popup:', {
        hasUser: !!user,
        userEmail: user?.email,
        userUid: user?.uid,
        currentUrl: window.location.href,
        timestamp: new Date().toISOString()
      });
      
      if (!authStateChecked) {
        authStateChecked = true;
        
        // If user is signed in, Firebase has processed the OAuth callback
        // The popup should close automatically, but we'll monitor it
        if (user) {
          console.log('[POPUP HANDLER] User authenticated in popup - Firebase should close popup automatically');
          console.log('[POPUP HANDLER] Popup will close automatically - do not close manually');
          
          // Firebase should automatically close the popup via its internal handler
          // We just wait and monitor. If it doesn't close, something is wrong.
          timeoutId = setTimeout(() => {
            if (!window.closed) {
              console.warn('[POPUP HANDLER] WARNING: Popup did not close automatically after auth success');
              console.warn('[POPUP HANDLER] This might indicate an issue with Firebase popup handling');
              console.warn('[POPUP HANDLER] Firebase should automatically close the popup - checking parent window...');
              
              // The parent window's signInWithPopup() should have received the result by now
              // If the popup is still open, there might be a communication issue
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'AUTH_SUCCESS', 
                    message: 'Authentication completed in popup - popup did not close automatically'
                  }, '*');
                }
              } catch (e) {
                console.error('[POPUP HANDLER] Could not send message to parent:', e);
              }
            }
          }, 5000);
        } else {
          console.log('[POPUP HANDLER] No user in popup - Firebase may still be processing the OAuth callback');
          console.log('[POPUP HANDLER] Waiting for Firebase to complete authentication...');
        }
      }
    });
    
    // Monitor popup window status
    let checkCount = 0;
    const maxChecks = 120; // 60 seconds max (500ms * 120)
    
    const checkInterval = setInterval(() => {
      checkCount++;
      
      // If popup is closed, stop checking
      if (window.closed) {
        console.log('[POPUP HANDLER] Popup window closed - authentication should be complete');
        clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
        unsubscribe();
        return;
      }
      
      // Log status periodically (every 10 checks = 5 seconds)
      if (checkCount % 10 === 0) {
        console.log('[POPUP HANDLER] Popup window status:', {
          url: window.location.href,
          readyState: document.readyState,
          openerExists: window.opener !== null,
          closed: window.closed,
          checkCount: checkCount,
          authStateChecked: authStateChecked
        });
      }
      
      // If we've checked too many times, something might be wrong
      if (checkCount >= maxChecks) {
        console.error('[POPUP HANDLER] Popup window did not close after 60 seconds - this might indicate an error');
        clearInterval(checkInterval);
        if (timeoutId) clearTimeout(timeoutId);
        unsubscribe();
        
        // Try to close the popup manually and notify parent
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'AUTH_ERROR', message: 'Authentication timeout' }, '*');
          }
        } catch (e) {
          console.error('[POPUP HANDLER] Could not send message to parent:', e);
        }
      }
    }, 500);
    
    return () => {
      clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);
  
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
        <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Processing authentication...</p>
        <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>This window will close automatically.</p>
        <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
          Please do not close this window manually.
        </p>
        <div style={{ marginTop: '30px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px', fontSize: '11px', color: '#666' }}>
          <p>Handler URL: {window.location.pathname}</p>
          <p>Has state param: {window.location.search.includes('state=') ? 'Yes' : 'No'}</p>
          <p>Is popup: {window.opener !== null ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

// Root Route Handler - checks if root path has OAuth params
const RootRouteHandler = () => {
  const search = window.location.search;
  const isPopup = window.opener !== null;
  const hasOAuthParams = search.includes('state=') || search.includes('code=') || (isPopup && search.length > 0);
  
  console.log('[ROOT ROUTE] Root route handler:', {
    pathname: window.location.pathname,
    search: search,
    isPopup: isPopup,
    hasOAuthParams: hasOAuthParams
  });
  
  if (hasOAuthParams) {
    return <OAuthHandler />;
  }
  
  return (
    <ProtectedRoute>
      <Navigate to="/dashboard" replace />
    </ProtectedRoute>
  );
};

// Protected Route - Only for authenticated users
const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  console.log('[ROUTE DEBUG] ProtectedRoute check:', {
    pathname: window.location.pathname,
    hasUser: !!currentUser,
    userEmail: currentUser?.email,
    hasProfile: !!userProfile,
    hasHouseholdId: !!userProfile?.householdId,
    householdId: userProfile?.householdId,
    loading: loading
  });

  if (loading) {
    console.log('[ROUTE DEBUG] Still loading, showing loader');
    return <PageLoader />;
  }

  // Not authenticated - redirect to login
  if (!currentUser) {
    console.log('[ROUTE DEBUG] Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Authenticated but no household - redirect to setup (except if already on setup page)
  if (!userProfile?.householdId && window.location.pathname !== '/setup') {
    console.log('[ROUTE DEBUG] No household, redirecting to /setup');
    return <Navigate to="/setup" replace />;
  }

  // Has household but trying to access setup - redirect to dashboard
  if (userProfile?.householdId && window.location.pathname === '/setup') {
    console.log('[ROUTE DEBUG] Has household but on /setup, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[ROUTE DEBUG] Route access granted');
  return children;
};

// Public Route - Only for non-authenticated users
const PublicRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  console.log('[ROUTE DEBUG] PublicRoute check:', {
    pathname: window.location.pathname,
    hasUser: !!currentUser,
    userEmail: currentUser?.email,
    hasProfile: !!userProfile,
    hasHouseholdId: !!userProfile?.householdId,
    loading: loading
  });

  if (loading) {
    console.log('[ROUTE DEBUG] Still loading, showing loader');
    return <PageLoader />;
  }

  // Already authenticated - redirect based on household status
  if (currentUser) {
    const destination = userProfile?.householdId ? '/dashboard' : '/setup';
    console.log('[ROUTE DEBUG] Already authenticated, redirecting to:', destination);
    return <Navigate to={destination} replace />;
  }

  console.log('[ROUTE DEBUG] Public route access granted');
  return children;
};

function App() {
  // Log initial app load
  React.useEffect(() => {
    console.log('[APP DEBUG] App initialized');
    console.log('[APP DEBUG] Initial URL:', window.location.href);
    console.log('[APP DEBUG] Initial pathname:', window.location.pathname);
    console.log('[APP DEBUG] Initial search:', window.location.search);
    console.log('[APP DEBUG] Initial hash:', window.location.hash);
    
    // Log route changes
    const handleLocationChange = () => {
      console.log('[APP DEBUG] Location changed:', {
        href: window.location.href,
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      });
    };
    
    window.addEventListener('popstate', handleLocationChange);
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };
    
    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(window.history, args);
      handleLocationChange();
    };
    
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

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

                  {/* Firebase OAuth Handler Routes (for popup callbacks) */}
                  {/* Firebase uses different handler URLs:
                      - /__/auth/handler (standard Firebase callback)
                      - /handler (alternative)
                      - /auth/handler (alternative)
                      - Or just root path with state= param
                  */}
                  <Route 
                    path="/__/auth/handler" 
                    element={<OAuthHandler />} 
                  />
                  <Route 
                    path="/handler" 
                    element={<OAuthHandler />} 
                  />
                  <Route 
                    path="/auth/handler" 
                    element={<OAuthHandler />} 
                  />
                  {/* Root Route - Also handle OAuth params (in case Firebase uses root + query) */}
                  <Route 
                    path="/" 
                    element={<RootRouteHandler />}
                  />

                  {/* 404 Route - Must be last */}
                  <Route 
                    path="*" 
                    element={
                      (() => {
                        const currentPath = window.location.pathname;
                        
                        // Check if we're in a popup window (Firebase OAuth callback)
                        const isPopup = window.opener !== null;
                        const hasStateParam = window.location.search.includes('state=');
                        const hasCodeParam = window.location.search.includes('code=');
                        const hasErrorParam = window.location.search.includes('error=');
                        const pathIncludesHandler = currentPath.includes('handler');
                        const isOAuthCallback = hasStateParam || hasCodeParam || hasErrorParam || pathIncludesHandler;
                        
                        // Firebase OAuth popup URLs can be:
                        // - handler?state=... (no leading slash, query param based)
                        // - /handler?state=...
                        // - /__/auth/handler?state=...
                        // - /auth/handler?state=...
                        // So we check for handler in path OR state/code in query
                        const isFirebaseHandler = isOAuthCallback || currentPath === '' || currentPath === '/';
                        
                        // Valid routes that should NOT show 404
                        const validRoutes = [
                          '/login',
                          '/setup',
                          '/dashboard',
                          '/profile',
                          '/expenses',
                          '/debts',
                          '/rent-bills',
                          '/members',
                          '/reports',
                          '/activity',
                          '/settings',
                          '/personal-expenses',
                          '/',
                          '/__/auth/handler',
                          '/handler',
                          '/auth/handler'
                        ];
                        
                        const isValidRoute = validRoutes.includes(currentPath);
                        
                        console.error('[404 DEBUG] 404 Route triggered!', {
                          pathname: currentPath,
                          isValidRoute: isValidRoute,
                          isPopup: isPopup,
                          isOAuthCallback: isOAuthCallback,
                          isFirebaseHandler: isFirebaseHandler,
                          hasStateParam: hasStateParam,
                          hasCodeParam: hasCodeParam,
                          hasErrorParam: hasErrorParam,
                          pathIncludesHandler: pathIncludesHandler,
                          currentUrl: window.location.href,
                          search: window.location.search,
                          hash: window.location.hash,
                          openerIsNull: window.opener === null,
                          documentReadyState: document.readyState,
                          windowName: window.name
                        });
                        
                        // If we're in a popup and it's an OAuth callback, show handler page
                        // OR if the pathname is empty/root with state param (Firebase handler?state=... pattern)
                        if ((isPopup && isOAuthCallback) || (isFirebaseHandler && (hasStateParam || hasCodeParam || hasErrorParam))) {
                          console.log('[404 DEBUG] This is a popup OAuth handler, allowing Firebase to handle it');
                          console.log('[POPUP HANDLER] Waiting for Firebase to complete authentication...');
                          console.log('[POPUP HANDLER] Popup URL details:', {
                            href: window.location.href,
                            search: window.location.search,
                            pathname: window.location.pathname
                          });
                          return (
                            <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                              <div>
                                <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
                                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>Completing authentication...</p>
                                <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>This window will close automatically.</p>
                                <p style={{ fontSize: '12px', color: '#999', marginTop: '20px' }}>
                                  If this window doesn't close, please close it manually.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        
                        // If it's a valid route but still hitting 404, it might be a timing issue
                        // Show loading instead of 404
                        if (isValidRoute && document.readyState !== 'complete') {
                          console.log('[404 DEBUG] Valid route but document not ready, showing loader');
                          return <PageLoader />;
                        }
                        
                        // Show actual 404 page for invalid routes
                        return (
                          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10">
                            <div className="text-center">
                              <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
                              <p className="text-2xl text-muted-foreground mb-8">Oops! Page not found</p>
                              <p className="text-sm text-muted-foreground mb-4">Path: {currentPath}</p>
                              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                              <a 
                                href="/" 
                                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                Go back home
                              </a>
                                <button
                                  onClick={() => {
                                    // Force hard reload by bypassing cache
                                    // Method that works in all modern browsers
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('_reload', Date.now());
                                    window.location.href = url.toString();
                                  }}
                                  className="inline-flex items-center px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors border border-border"
                                >
                                  🔄 Hard Reload
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()
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
