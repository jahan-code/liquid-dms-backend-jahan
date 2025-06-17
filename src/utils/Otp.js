const otpStore = new Map();
const requestStore = new Map();

// Generate a unique 4-digit OTP as string
const generateOTP = () => {
  let otp;
  do {
    otp = Math.floor(1000 + Math.random() * 9000).toString();
  } while (Array.from(otpStore.values()).some((stored) => stored.otp === otp));
  return otp;
};

// Save OTP with expiration (2 minutes)
const setOTP = (email, otp) => {
  otpStore.set(email.toLowerCase(), {
    otp,
    expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes
  });
};

// Retrieve OTP details for verification
const getOTP = (email) => otpStore.get(email.toLowerCase());

// Delete OTP after use or expiry
const deleteOTP = (email) => otpStore.delete(email.toLowerCase());

// Track OTP request attempts & apply rate limits
const trackRequest = (email) => {
  email = email.toLowerCase();
  const now = Date.now();

  const maxAttempts = 2;
  const waitBetweenMs = 2 * 60 * 1000; // 2 minutes between requests
  const lockoutMs = 15 * 60 * 1000; // 15 minutes lockout after max attempts

  let requests = requestStore.get(email) || {
    attempts: [],
    lockoutUntil: null,
  };

  // Reset lockout if expired
  if (requests.lockoutUntil && now > requests.lockoutUntil) {
    requests = { attempts: [], lockoutUntil: null };
  }

  // If locked out, deny request
  if (requests.lockoutUntil) {
    return {
      allowed: false,
      reason: `Too many OTP requests. Try again in ${Math.ceil(
        (requests.lockoutUntil - now) / 60000
      )} minute(s).`,
    };
  }

  // Remove attempts older than lockout window
  requests.attempts = requests.attempts.filter(
    (time) => now - time < lockoutMs
  );

  // Check cooldown between requests
  if (requests.attempts.length > 0) {
    const lastRequestTime = requests.attempts[requests.attempts.length - 1];
    if (now - lastRequestTime < waitBetweenMs) {
      return {
        allowed: false,
        reason: `Please wait ${Math.ceil(
          (waitBetweenMs - (now - lastRequestTime)) / 60000
        )} minute(s) before requesting another OTP.`,
      };
    }
  }

  // Lock out if too many attempts
  if (requests.attempts.length >= maxAttempts) {
    requests.lockoutUntil = now + lockoutMs;
    requestStore.set(email, requests);
    return {
      allowed: false,
      reason: `Too many OTP requests. Try again in ${Math.ceil(
        lockoutMs / 60000
      )} minute(s).`,
    };
  }

  // Record current attempt and allow request
  requests.attempts.push(now);
  requestStore.set(email, requests);
  return { allowed: true };
};

// Verify OTP validity
const verifyOTP = (email, inputOtp) => {
  email = email.toLowerCase();
  const stored = otpStore.get(email);
  if (!stored) return { valid: false, reason: 'OTP not found or expired' };

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return { valid: false, reason: 'OTP expired' };
  }

  if (stored.otp !== inputOtp.toString()) {
    return { valid: false, reason: 'Invalid OTP' };
  }

  // OTP is valid — delete it to prevent reuse
  otpStore.delete(email);
  return { valid: true };
};

// Cleanup expired OTPs and request logs regularly
const cleanupExpired = () => {
  const now = Date.now();
  const lockoutMs = 15 * 60 * 1000;

  // Cleanup expired OTPs
  for (const [email, { expiresAt }] of otpStore.entries()) {
    if (now > expiresAt) {
      otpStore.delete(email);
    }
  }

  // Cleanup request attempts and expired lockouts
  for (const [email, { attempts, lockoutUntil }] of requestStore.entries()) {
    if (!lockoutUntil && attempts.every((time) => now - time > lockoutMs)) {
      requestStore.delete(email);
    } else if (lockoutUntil && now > lockoutUntil) {
      requestStore.set(email, { attempts: [], lockoutUntil: null });
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);

export default {
  generateOTP,
  setOTP,
  getOTP,
  deleteOTP,
  verifyOTP,
  trackRequest,
};
