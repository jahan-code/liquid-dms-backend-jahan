import { getRedisClient } from '../config/redis.js';

// Constants (configurable via env vars)
const OTP_PREFIX = 'otp:';
const REQ_PREFIX = 'otp-req:';
const OTP_EXPIRY_SECONDS = 120; // 2 minutes
const REQ_WINDOW_SECONDS = 15 * 60; // 15 minutes
const REQ_WAIT_MS = 2 * 60 * 1000; // 2 minutes between requests
const MAX_ATTEMPTS = 3; // Max OTP requests per window
const LOCKOUT_MS = 15 * 60 * 1000; // 1-minute lockout after max attempts

// Type-aware Redis key for OTP (register, forgot, etc.)
const getOTPKey = (email, type) =>
  `${OTP_PREFIX}${type}:${email.toLowerCase()}`;

const getReqKey = (email) => `${REQ_PREFIX}${email.toLowerCase()}`;

// Stronger OTP Generator (4-digit for now)
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Set OTP for a specific purpose
const setOTP = async (email, otp, type) => {
  const redis = getRedisClient();
  const key = getOTPKey(email, type);
  await redis.setEx(key, OTP_EXPIRY_SECONDS, otp);
};

// Get OTP for verification
const getOTP = async (email, type) => {
  const redis = getRedisClient();
  const key = getOTPKey(email, type);
  return await redis.get(key);
};

// Delete OTP after use
const deleteOTP = async (email, type) => {
  const redis = getRedisClient();
  const key = getOTPKey(email, type);
  await redis.del(key);
};

// Verify OTP with strict type enforcement
const verifyOTP = async (email, inputOtp, type) => {
  const storedOtp = await getOTP(email, type);
  if (!storedOtp) {
    return {
      valid: false,
      code: 'OTP_EXPIRED',
      message: 'Your OTP has expired. Please request a new one.',
    };
  }

  if (storedOtp !== inputOtp.toString()) {
    return {
      valid: false,
      code: 'OTP_INVALID',
      message: 'Invalid OTP',
    };
  }

  await deleteOTP(email, type);

  return {
    valid: true,
    code: 'OTP_VALID',
    message: 'OTP verified successfully',
  };
};

// OTP rate-limiting per user (email)
const trackRequest = async (email) => {
  const redis = getRedisClient();
  const key = getReqKey(email);
  const now = Date.now();

  const data = await redis.get(key);
  let record = data ? JSON.parse(data) : { attempts: [], lockoutUntil: null };

  // Reset if lockout expired
  if (record.lockoutUntil && now >= record.lockoutUntil) {
    record = { attempts: [], lockoutUntil: null };
  }

  // Lockout still in effect
  if (record.lockoutUntil && now < record.lockoutUntil) {
    const remainingMs = record.lockoutUntil - now;
    return {
      allowed: false,
      code: 'LOCKED_OUT',
      message: `Too many requests. Try again in ${Math.ceil(remainingMs / 1000)} seconds.`,
    };
  }

  // Filter only recent attempts
  record.attempts = record.attempts.filter(
    (time) => now - time < REQ_WINDOW_SECONDS * 1000
  );

  // Check cooldown between attempts
  const lastAttempt = record.attempts.at(-1);
  if (lastAttempt && now - lastAttempt < REQ_WAIT_MS) {
    const remainingMs = REQ_WAIT_MS - (now - lastAttempt);
    return {
      allowed: false,
      code: 'TOO_SOON',
      message: `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another OTP.`,
    };
  }

  // Lockout after max attempts
  if (record.attempts.length >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_MS;
    await redis.setEx(key, REQ_WINDOW_SECONDS, JSON.stringify(record));
    return {
      allowed: false,
      code: 'MAX_ATTEMPTS',
      message: `Too many requests. Try again in ${LOCKOUT_MS / 1000} seconds.`,
    };
  }

  // Allow request
  record.attempts.push(now);
  await redis.setEx(key, REQ_WINDOW_SECONDS, JSON.stringify(record));
  return {
    allowed: true,
    code: 'ALLOWED',
    message: 'OTP request allowed',
  };
};
const clearOtpCache = async (email) => {
  const redis = getRedisClient();
  const emailKey = email.toLowerCase();

  await redis.del(`otp:register:${emailKey}`);
  await redis.del(`otp:forgot:${emailKey}`);
  await redis.del(`otp-req:${emailKey}`);
};
export default {
  generateOTP,
  setOTP,
  getOTP,
  deleteOTP,
  verifyOTP,
  trackRequest,
  clearOtpCache,
};
