import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { resetPasswordSchema } from '../../lib/schemas';
import { supabase } from '../../lib/supabase';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.updateUser({
        password: data.password
      });

      if (resetError) throw resetError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 text-center fade-in">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Password Updated</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Your password has been reset successfully. Redirecting you to login...</p>
        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 animate-progress"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Password</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Please enter your new secure password</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm rounded-2xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              {...register('password')}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="••••••••"
            />
          </div>
          {errors.password && <p className="mt-1 text-[10px] font-bold text-rose-500 ml-1">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              {...register('confirmPassword')}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="••••••••"
            />
          </div>
          {errors.confirmPassword && <p className="mt-1 text-[10px] font-bold text-rose-500 ml-1">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Updating...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
