import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OtpPage from './pages/auth/OtpPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import LandingPage from './pages/LandingPage';
import ConfigCheck from './components/auth/ConfigCheck';
import Layout from './components/auth/Layout';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide">Initializing Cashlens...</p>
        </div>
      </div>
    );
  }

  return (
    <ConfigCheck>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route 
              path="/login" 
              element={!session ? <Layout><LoginPage /></Layout> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!session ? <Layout><RegisterPage /></Layout> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/otp" 
              element={<Layout><OtpPage /></Layout>} 
            />
            <Route 
              path="/reset-password" 
              element={<Layout><ResetPasswordPage /></Layout>} 
            />
            <Route 
              path="/dashboard" 
              element={session ? <Dashboard user={session.user} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/" 
              element={session ? <Navigate to="/dashboard" /> : <LandingPage />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/" />} 
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </ConfigCheck>
  );
}

export default App;
