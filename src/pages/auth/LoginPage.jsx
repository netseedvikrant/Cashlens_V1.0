import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { loginSchema } from '../../lib/schemas';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, Loader2, Globe, CheckCircle } from 'lucide-react';
import { z } from 'zod';

import confetti from 'canvas-confetti';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(isForgotMode ? z.object({ email: z.string().email('Invalid email format') }) : loginSchema),
  });

  // Reset form errors when switching modes
  React.useEffect(() => {
    reset();
  }, [isForgotMode]);

  const onSubmit = async (data) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      if (isForgotMode) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setForgotSuccess(true);
        setLoading(false);
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (loginError) throw loginError;

        // Money Confetti Celebration!
        const scalar = 2.5;
        const money = confetti.shapeFromText({ text: '💵', scalar });
        const moneyWings = confetti.shapeFromText({ text: '💸', scalar });
        const bag = confetti.shapeFromText({ text: '💰', scalar });

        const defaults = {
          spread: 360,
          ticks: 150,
          gravity: 0.8,
          decay: 0.96,
          startVelocity: 35,
          shapes: [money, moneyWings, bag],
          scalar
        };

        const shoot = () => {
          confetti({
            ...defaults,
            particleCount: 40,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
          });
        };

        // Initial bursts
        shoot();
        setTimeout(shoot, 200);
        setTimeout(shoot, 400);
        setTimeout(shoot, 700);

        // Rain from the top
        const end = Date.now() + 2000;
        const frame = () => {
          if (Date.now() > end) return;
          confetti({
            ...defaults,
            particleCount: 2,
            angle: 270,
            spread: 180,
            origin: { x: Math.random(), y: -0.1 },
            startVelocity: 15,
          });
          requestAnimationFrame(frame);
        };
        frame();

        // Navigate after the peak of the effect
        setTimeout(() => {
          navigate('/dashboard');
        }, 2200);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!supabase) return;
    try {
      // Flag to show confetti on dashboard mount after redirect
      sessionStorage.setItem('showConfetti', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
        }
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'Failed to initialize Google login');
      sessionStorage.removeItem('showConfetti');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome Back</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Access your financial dashboard</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm rounded-2xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
          {error}
        </div>
      )}

      {forgotSuccess ? (
        <div className="text-center py-4">
          <div className="mb-4 flex justify-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Check your email</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">We've sent a password reset link to your email address.</p>
          <button 
            onClick={() => { setIsForgotMode(false); setForgotSuccess(false); }}
            className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
          >
            Back to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                {...register('email')}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                placeholder="name@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-[10px] font-bold text-rose-500 ml-1">{errors.email.message}</p>}
          </div>

          {!isForgotMode && (
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Password</label>
                <button 
                  type="button"
                  onClick={() => setIsForgotMode(true)}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 uppercase tracking-wider"
                >
                  Forgot?
                </button>
              </div>
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
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isForgotMode ? 'Sending...' : 'Signing in...'}
              </>
            ) : (
              isForgotMode ? 'Send Reset Link' : 'Sign In'
            )}
          </button>

          {isForgotMode && (
            <button 
              type="button"
              onClick={() => setIsForgotMode(false)}
              className="w-full text-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-bold transition-colors"
            >
              Back to Login
            </button>
          )}
        </form>
      )}

      <div className="relative my-10">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-bold uppercase tracking-widest">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-sm"
      >
        <Globe className="w-5 h-5" />
        Continue with Google
      </button>

      <div className="mt-10 text-center pt-8 border-t border-slate-50 dark:border-slate-800">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
