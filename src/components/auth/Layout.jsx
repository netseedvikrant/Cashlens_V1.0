import React from 'react';
import ThemeToggle from '../ThemeToggle';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="fixed top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10 fade-in">
          <div className="p-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none mb-4 border border-slate-100 dark:border-slate-800">
            <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Cashlens</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Smart expenses on the go.</p>
        </div>
        
        <div className="w-full">
          {children}
        </div>
      </div>
      
      <footer className="mt-12 text-slate-400 dark:text-slate-600 text-xs font-medium tracking-widest uppercase">
        © 2026 Cashlens App
      </footer>
    </div>
  );
};

export default Layout;
