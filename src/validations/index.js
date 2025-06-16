import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  resendOtpSchema,
} from './auth.validation.js';

const validationSchemas = {
  // Authentication

  '/auth/register': { POST: registerSchema },
  '/auth/login': { POST: loginSchema },
  '/auth/forget-password': { POST: forgotPasswordSchema },
  '/auth/verify-otp': { POST: verifyOtpSchema },
  '/auth/reset-password': { POST: resetPasswordSchema },
  '/auth/resend-otp': { POST: resendOtpSchema },
  '/health': { health: { GET: null } },
};

export { validationSchemas };
