import React from 'react';

const ConfigCheck = ({ children }) => {
  const isConfigured = 
    Boolean(import.meta.env.VITE_SUPABASE_URL) && 
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-colors duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-10 max-w-md w-full border border-slate-100 dark:border-slate-800 text-center fade-in">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-8 mx-auto">
            <span className="text-rose-600 dark:text-rose-400 text-4xl font-black italic">!</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3 tracking-tight">Configuration Required</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
            Welcome to <span className="text-blue-600 font-bold">Cashlens</span>. Please set up your Supabase project and add the environment variables to your <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-500 font-mono">.env</code> file.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 text-left w-full space-y-3 font-mono text-[11px] border border-slate-100 dark:border-slate-700 shadow-inner">
            <p className="text-slate-400 dark:text-slate-500"># Required in .env:</p>
            <p className="text-blue-600 dark:text-blue-400 truncate">VITE_SUPABASE_URL=YOUR_URL</p>
            <p className="text-blue-600 dark:text-blue-400 truncate">VITE_SUPABASE_ANON_KEY=YOUR_KEY</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ConfigCheck;
