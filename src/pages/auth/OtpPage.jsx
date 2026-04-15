import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { otpSchema } from '../../lib/schemas';
import { supabase } from '../../lib/supabase';
import { KeyRound, Loader2, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

const OtpPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timer, setTimer] = useState(300);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [resendTimer, setResendTimer] = useState(30);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { email, phone, type } = location.state || {};

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendDisabled(false);
    }
  }, [resendTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data) => {
    if (!supabase || !email) {
      setError('Verification details missing. Please register again.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const verifyOptions = {
        token: data.otp,
        type: type === 'phone' ? 'sms' : 'signup',
      };

      if (type === 'phone' && phone) {
        verifyOptions.phone = phone;
      } else {
        verifyOptions.email = email;
      }

      const { data: { user }, error: verifyError } = await supabase.auth.verifyOtp(verifyOptions);

      if (verifyError) throw verifyError;

      // Ensure user profile is stored in Supabase 'profiles' table
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            phone: user.user_metadata?.phone || phone || '',
            avatar_url: user.user_metadata?.avatar_url || null,
            updated_at: new Date().toISOString(),
          });
        
        if (profileError) {
          console.warn("Profile sync error (table might not exist):", profileError.message);
          // We don't throw here to avoid blocking the user if the table is missing
        }
      }

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

      confetti({ ...defaults, particleCount: 80, origin: { y: 0.6 } });
      setTimeout(() => confetti({ ...defaults, particleCount: 40, origin: { x: 0.2, y: 0.5 } }), 200);
      setTimeout(() => confetti({ ...defaults, particleCount: 40, origin: { x: 0.8, y: 0.5 } }), 400);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Invalid OTP code');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendDisabled || !supabase) return;
    
    setResendDisabled(true);
    setResendTimer(30);
    try {
      if (type === 'phone' && phone) {
        // For phone: re-trigger via signInWithOtp (same as initial send)
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
      } else {
        // For email: use the standard resend
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email,
        });
        if (error) throw error;
      }
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to resend verification code');
    }
  };

  if (!email) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 text-center fade-in">
        <p className="text-rose-500 mb-4 font-bold">No verification context found.</p>
        <button onClick={() => navigate('/register')} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Back to Register</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Verify Account</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Enter the code sent to <span className="font-bold text-slate-700 dark:text-slate-300">{type === 'phone' ? phone : email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm rounded-2xl flex items-center gap-2 font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Verification Code</label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              {...register('otp')}
              maxLength={6}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-center text-3xl tracking-[0.4em] font-mono dark:text-white"
              placeholder="000000"
            />
          </div>
          {errors.otp && <p className="mt-1 text-[10px] font-bold text-rose-500 ml-1">{errors.otp.message}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Expires: <span className={`font-mono font-bold ${timer < 60 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{formatTime(timer)}</span>
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendDisabled}
            className={`flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider transition-colors ${resendDisabled ? 'text-slate-300 dark:text-slate-700' : 'text-blue-600 dark:text-blue-400 hover:text-blue-700'}`}
          >
            <Send className="w-3.5 h-3.5" />
            {resendDisabled ? `Wait ${resendTimer}s` : 'Resend Code'}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || timer === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify identity'}
        </button>
      </form>

      <div className="mt-8 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed shadow-inner">
        <p>
          <strong className="text-slate-700 dark:text-slate-300">Tip:</strong> {type === 'phone' 
            ? "Ensure your phone has a stable network connection. It might take a minute for the SMS to arrive." 
            : "Check your spam folder if you don't see the email. You can also click the verification link in the email directly."}
        </p>
      </div>
    </div>
  );
};


export default OtpPage;
