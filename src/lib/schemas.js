import { z } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

export const authSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string().refine((val) => val && isValidPhoneNumber(val), {
    message: 'Invalid phone number format',
  }),
  otpMethod: z.enum(['email', 'phone']).default('email'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});
