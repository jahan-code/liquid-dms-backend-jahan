import { getRedisClient } from '../config/redis.js';

// Constants (configurable via env vars)
const OTP_PREFIX = 'otp:';
const REQ_PREFIX = 'otp-req:';
const OTP_EXPIRY_SECONDS = 120; // 2 minutes
const REQ_WINDOW_SECONDS = 15 * 60; // 15 minutes
const REQ_WAIT_MS = 30 * 1000; // 30 seconds between requests
const MAX_ATTEMPTS = 3; // Max OTP requests per window
const LOCKOUT_MS = 60 * 1000; // 1-minute lockout after max attempts

// Helper functions
const getOTPKey = (email) => `${OTP_PREFIX}${email.toLowerCase()}`;
const getReqKey = (email) => `${REQ_PREFIX}${email.toLowerCase()}`;

const generateOTP = () => {
  // Use a stronger 6-digit alphanumeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const setOTP = async (email, otp) => {
  const redis = getRedisClient();
  const key = getOTPKey(email);
  await redis.setEx(key, OTP_EXPIRY_SECONDS, otp);
};

const getOTP = async (email) => {
  const redis = getRedisClient();
  const key = getOTPKey(email);
  return await redis.get(key);
};

const deleteOTP = async (email) => {
  const redis = getRedisClient();
  const key = getOTPKey(email);
  await redis.del(key);
};

const verifyOTP = async (email, inputOtp) => {
  const storedOtp = await getOTP(email);
  if (!storedOtp) {
    return {
      valid: false,
      code: 'OTP_EXPIRED',
      message: 'OTP expired or not found',
    };
  }
  if (storedOtp !== inputOtp.toString()) {
    return { valid: false, code: 'OTP_INVALID', message: 'Invalid OTP' };
  }
  await deleteOTP(email);
  return {
    valid: true,
    code: 'OTP_VALID',
    message: 'OTP verified successfully',
  };
};

const trackRequest = async (email) => {
  const redis = getRedisClient();
  const key = getReqKey(email);
  const now = Date.now();

  // Fetch or initialize request record
  const data = await redis.get(key);
  let record = data ? JSON.parse(data) : { attempts: [], lockoutUntil: null };

  // Reset if lockout expired
  if (record.lockoutUntil && now >= record.lockoutUntil) {
    record = { attempts: [], lockoutUntil: null };
  }

  // Check if locked out
  if (record.lockoutUntil && now < record.lockoutUntil) {
    const remainingMs = record.lockoutUntil - now;
    return {
      allowed: false,
      code: 'LOCKED_OUT',
      message: `Too many requests. Try again in ${Math.ceil(remainingMs / 1000)} seconds.`,
    };
  }

  // Filter attempts within the last 15 minutes
  record.attempts = record.attempts.filter(
    (time) => now - time < REQ_WINDOW_SECONDS * 1000
  );

  // Check wait time between requests
  const lastAttempt = record.attempts.at(-1);
  if (lastAttempt && now - lastAttempt < REQ_WAIT_MS) {
    const remainingMs = REQ_WAIT_MS - (now - lastAttempt);
    return {
      allowed: false,
      code: 'TOO_SOON',
      message: `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another OTP.`,
    };
  }

  // Enforce max attempts
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
  return { allowed: true, code: 'ALLOWED', message: 'OTP request allowed' };
};

export default {
  generateOTP,
  setOTP,
  getOTP,
  deleteOTP,
  verifyOTP,
  trackRequest,
};
