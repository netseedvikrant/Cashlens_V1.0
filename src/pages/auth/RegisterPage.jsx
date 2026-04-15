import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { authSchema } from '../../lib/schemas';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      phone: '',
      otpMethod: 'email',
    }
  });

  const selectedMethod = watch('otpMethod');

  const onSubmit = async (data) => {
    if (!supabase) return;
    setLoading(true);
    setError(null);
    try {
      // Step 1: Create the account (email-based signup)
      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
        },
      });

      // If user chose EMAIL and signup failed, stop here
      if (authError && data.otpMethod === 'email') {
        throw authError;
      }

      // If user chose SMS, proceed to send phone OTP regardless of email errors
      // (e.g., email rate limit is irrelevant when verifying via phone)
      if (data.otpMethod === 'phone') {
        const { error: phoneOtpError } = await supabase.auth.signInWithOtp({
          phone: data.phone,
        });
        if (phoneOtpError) throw phoneOtpError;
      }

      navigate('/otp', { 
        state: { 
          email: data.email, 
          phone: data.phone, 
          type: data.otpMethod === 'phone' ? 'phone' : 'signup' 
        } 
      });
    } catch (err) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none p-8 border border-slate-100 dark:border-slate-800 fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Join Cashlens</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start tracking your wealth today</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 text-rose-700 dark:text-rose-400 text-sm rounded-2xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></div>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              {...register('fullName')}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
              placeholder="John Doe"
            />
          </div>
          {errors.fullName && <p className="mt-1 text-[10px] font-bold text-rose-500 ml-1">{errors.fullName.message}</p>}
        </div>

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

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Phone Number</label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <PhoneInput
                {...field}
                international
                defaultCountry="IN"
                className="phone-input-container bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden"
              />
            )}
          />
          {errors.phone && <p className="mt-1 text-[10px] font-bold text-rose-500 ml-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 ml-1">Receive OTP via</label>
          <div className="grid grid-cols-2 gap-4">
            <label className={`
              flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer
              ${selectedMethod === 'email' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400' 
                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500'}
            `}>
              <input type="radio" {...register('otpMethod')} value="email" className="hidden" />
              <Mail className="w-4 h-4" />
              <span className="text-sm font-bold">Email</span>
            </label>
            <label className={`
              flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer
              ${selectedMethod === 'phone' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-400' 
                : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500'}
            `}>
              <input type="radio" {...register('otpMethod')} value="phone" className="hidden" />
              <Phone className="w-4 h-4" />
              <span className="text-sm font-bold">SMS</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
        </button>
      </form>

      <div className="mt-10 text-center pt-8 border-t border-slate-50 dark:border-slate-800">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
