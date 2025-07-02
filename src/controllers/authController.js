// 📁 controllers/auth.controller.js

import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import otpUtils from '../utils/Otp.js';
import sendEmail from '../utils/sendEmail.js';
import SuccessHandler from '../utils/SuccessHandler.js';

// -------------------- Register --------------------
const register = async (req, res, next) => {
  try {
    const { fullname, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: 'User already exists' });

    const track = await otpUtils.trackRequest(email);
    if (!track.allowed) return res.status(429).json({ message: track.message });

    const otp = otpUtils.generateOTP();
    await otpUtils.setOTP(email, otp, 'register');

    await sendEmail({
      to: email,
      subject: 'Verify Your Email',
      templateName: 'otpTemplate',
      replacements: { fullname: fullname || 'User', otp },
    });

    const newUser = new User({ fullname, email, password, isVerified: false });
    await newUser.save();
    const userResponse = {
      fullname: newUser.fullname,
      email: newUser.email,
    };
    return SuccessHandler(
      userResponse,

      200,
      'User logged in successfully',
      res
    );
  } catch (err) {
    next(err);
  }
};

// -------------------- Forgot Password --------------------
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.isVerified)
      return res
        .status(404)
        .json({ message: 'Account not found or not verified' });

    const track = await otpUtils.trackRequest(email);
    if (!track.allowed) return res.status(429).json({ message: track.message });

    const otp = otpUtils.generateOTP();
    await otpUtils.setOTP(email, otp, 'forgot');

    await sendEmail({
      to: email,
      subject: 'Reset Password OTP',
      templateName: 'forgetPasswordTemplate',
      replacements: { fullname: user.fullname || 'User', otp },
    });
    const userResponse = {
      email: user.email,
    };
    return SuccessHandler(
      userResponse,

      200,
      'Password reset OTP sent successfully',
      res
    );
  } catch (err) {
    next(err);
  }
};

// -------------------- Unified OTP Verification --------------------
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const type = !user.isVerified ? 'register' : 'forgot';
    const result = await otpUtils.verifyOTP(email, otp, type);

    if (!result.valid) return res.status(400).json({ message: result.message });

    if (type === 'register') {
      user.isVerified = true;
    } else {
      user.isResetOtpVerified = true;
    }

    await user.save();

    const userResponse = {
      email: user.email,
    };
    if (type === 'register') {
      return SuccessHandler(
        userResponse,
        200,
        'OTP verified successfully. You can now log in.',
        res
      );
    } else {
      return SuccessHandler(
        userResponse,
        200,
        'OTP verified successfully. You can now reset your password.',
        res
      );
    }
  } catch (err) {
    next(err);
  }
};

// -------------------- Unified Resend OTP --------------------
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const type = !user.isVerified ? 'register' : 'forgot';
    const subject =
      type === 'register' ? 'Your OTP Code' : 'Reset Password OTP';
    const template =
      type === 'register' ? 'otpTemplate' : 'forgetPasswordTemplate';

    const track = await otpUtils.trackRequest(email);
    if (!track.allowed) return res.status(429).json({ message: track.message });

    const otp = otpUtils.generateOTP();
    await otpUtils.setOTP(email, otp, type);

    await sendEmail({
      to: email,
      subject,
      templateName: template,
      replacements: { fullname: user.fullname || 'User', otp },
    });
    const userResponse = {
      email: user.email,
    };
    return SuccessHandler(
      userResponse,
      200,
      `OTP resent for ${type === 'register' ? 'verification' : 'password reset'}.`,
      res
    );
  } catch (err) {
    next(err);
  }
};

// -------------------- Reset Password --------------------
const resetPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.isResetOtpVerified)
      return res
        .status(403)
        .json({ message: 'Please verify OTP before resetting password.' });

    user.password = newPassword;
    user.isResetOtpVerified = false;
    await user.save();

    const userResponse = {
      email: user.email,
    };
    return SuccessHandler(
      userResponse,
      200,
      'Password reset successfully.',
      res
    );
  } catch (err) {
    next(err);
  }
};

// -------------------- Login --------------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified)
      return res
        .status(403)
        .json({ message: 'Please verify your email first.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });
    const userResponse = {
      email: user.email,
      fullname: user.fullname,
      token,
      vendors: user.vendors, // Assuming vendorId is part of the User model
    };
    return SuccessHandler(
      userResponse,
      200,
      'User logged in successfully.',
      res
    );
  } catch (err) {
    next(err);
  }
};

// -------------------- Export --------------------
export default {
  register,
  forgotPassword,
  verifyOtp, // unified for both flows
  resendOtp, // unified for both flows
  resetPassword,
  login,
};
