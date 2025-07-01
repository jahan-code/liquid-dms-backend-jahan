import { getRedisClient } from '../config/redis.js';

const OTP_PREFIX = 'otp:';
const REQ_PREFIX = 'otp-req:';

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const setOTP = async (email, otp) => {
  const redis = getRedisClient(); // ✅ move inside
  const key = OTP_PREFIX + email.toLowerCase();
  console.log(`🔐 Saving OTP ${otp} to Redis with key: ${key}`);
  await redis.setEx(key, 120, otp); // expire in 120 seconds
};

const getOTP = async (email) => {
  const redis = getRedisClient(); // ✅
  const key = OTP_PREFIX + email.toLowerCase();
  return await redis.get(key);
};

const deleteOTP = async (email) => {
  const redis = getRedisClient(); // ✅
  const key = OTP_PREFIX + email.toLowerCase();
  await redis.del(key);
};

const verifyOTP = async (email, inputOtp) => {
  const stored = await getOTP(email);
  if (!stored) return { valid: false, reason: 'OTP expired or not found' };
  if (stored !== inputOtp.toString())
    return { valid: false, reason: 'Invalid OTP' };
  await deleteOTP(email);
  return { valid: true };
};

const trackRequest = async (email) => {
  const redis = getRedisClient(); // ✅
  const key = REQ_PREFIX + email.toLowerCase();
  const now = Date.now();

  const data = await redis.get(key);
  let record = data ? JSON.parse(data) : { attempts: [], lockoutUntil: null };

  if (record.lockoutUntil && now > record.lockoutUntil) {
    record = { attempts: [], lockoutUntil: null };
  }

  if (record.lockoutUntil && now < record.lockoutUntil) {
    return {
      allowed: false,
      reason: `Too many OTP requests. Try again in ${Math.ceil(
        (record.lockoutUntil - now) / 60000
      )} minute(s).`,
    };
  }

  record.attempts = record.attempts.filter(
    (time) => now - time < 15 * 60 * 1000
  );

  const waitBetween = 30 * 1000;
  const maxAttempts = 2;
  const lockoutMs = 60 * 1000;

  const last = record.attempts.at(-1);
  if (last && now - last < waitBetween) {
    return {
      allowed: false,
      reason: `Please wait ${Math.ceil(
        (waitBetween - (now - last)) / 1000
      )} seconds before requesting another OTP.`,
    };
  }

  if (record.attempts.length >= maxAttempts) {
    record.lockoutUntil = now + lockoutMs;
    await redis.setEx(key, 900, JSON.stringify(record));
    return {
      allowed: false,
      reason: `Too many OTP requests. Try again in ${lockoutMs / 1000} seconds.`,
    };
  }

  record.attempts.push(now);
  await redis.setEx(key, 900, JSON.stringify(record)); // 15-minute window
  return { allowed: true };
};

export default {
  generateOTP,
  setOTP,
  getOTP,
  deleteOTP,
  verifyOTP,
  trackRequest,
};
