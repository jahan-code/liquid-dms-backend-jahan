import User from '../models/user.js';

import otpUtils from '../utils/Otp.js';
import sendEmail from '../utils/sendEmail.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import errorConstants from '../utils/errors.js';
import ApiError from '../utils/ApiError.js';
import generateJwt from '../utils/jwt.js';

// Helper function to normalize email consistently
const normalizeEmail = (email) => {
  return email ? email.toLowerCase().trim() : '';
};

const register = async (req, res, next) => {
  try {
    const { fullname, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Use case-insensitive email lookup to handle existing users with different casing
    const userExists = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    });

    if (userExists) {
      if (userExists.isVerified) {
        // User exists and is verified: return success with user info
        return next(
          new ApiError(errorConstants.AUTHENTICATION.USER_ALREADY_EXISTS, 401)
        );
      } else {
        // User exists but is NOT verified: resend OTP
        await otpUtils.clearOtpCache(normalizedEmail);
        const otp = otpUtils.generateOTP();
        await otpUtils.setOTP(normalizedEmail, otp, 'register');
        await sendEmail({
          to: normalizedEmail,
          subject: 'Verify Your Email',
          templateName: 'otpTemplate',
          replacements: { fullname: fullname || 'User', otp },
        });
        const userResponse = {
          fullname: userExists.fullname,
          email: userExists.email,
        };
        return SuccessHandler(
          userResponse,
          200,
          'You are not Verified. Please complete registration.',
          res
        );
      }
    } else {
      // User does not exist: create new user and send OTP
      await otpUtils.clearOtpCache(normalizedEmail);
      const otp = otpUtils.generateOTP();
      await otpUtils.setOTP(normalizedEmail, otp, 'register');
      await sendEmail({
        to: normalizedEmail,
        subject: 'Verify Your Email',
        templateName: 'otpTemplate',
        replacements: { fullname: fullname || 'User', otp },
      });
      const newUser = new User({
        fullname,
        email: normalizedEmail,
        password,
        isVerified: false,
      });
      await newUser.save();
      const userResponse = {
        fullname: newUser.fullname,
        email: newUser.email,
      };
      return SuccessHandler(
        userResponse,
        201,
        'User registered successfully',
        res
      );
    }
  } catch (err) {
    next(err);
  }
};
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Use case-insensitive email lookup
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    }).lean();
    if (!user) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404)
      );
    }

    if (!user.isVerified) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_VERIFIED, 403)
      );
    }

    const isFirstTime = !(await otpUtils.hasRequestedBefore(normalizedEmail));
    if (!isFirstTime) {
      const track = await otpUtils.trackRequest(normalizedEmail);
      if (!track.allowed)
        return res.status(429).json({ message: track.message });
    }

    const otp = otpUtils.generateOTP();
    await otpUtils.setOTP(normalizedEmail, otp, 'forgot');

    await sendEmail({
      to: normalizedEmail,
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

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Use case-insensitive email lookup
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    });
    if (!user) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_VERIFIED, 403)
      );
    }
    const type = !user.isVerified ? 'register' : 'forgot';
    const result = await otpUtils.verifyOTP(normalizedEmail, otp, type);

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
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Use case-insensitive email lookup
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    }).lean();
    if (!user) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404)
      );
    }

    const type = !user.isVerified ? 'register' : 'forgot';
    const subject =
      type === 'register' ? 'Your OTP Code' : 'Reset Password OTP';
    const template =
      type === 'register' ? 'otpTemplate' : 'forgetPasswordTemplate';

    const track = await otpUtils.trackRequest(normalizedEmail);
    if (!track.allowed) return res.status(429).json({ message: track.message });

    const otp = otpUtils.generateOTP();
    await otpUtils.setOTP(normalizedEmail, otp, type);

    await sendEmail({
      to: normalizedEmail,
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
    const normalizedEmail = normalizeEmail(email);

    // Use case-insensitive email lookup
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    });
    if (!user)
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_FOUND, 404)
      );

    if (!user.isResetOtpVerified)
      return next(
        new ApiError(errorConstants.AUTHENTICATION.OTP_NOT_VERIFIED, 403)
      );
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
    const normalizedEmail = normalizeEmail(email);

    // Use case-insensitive email lookup
    const user = await User.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    });
    if (!user || !(await user.comparePassword(password)))
      return next(
        new ApiError(errorConstants.AUTHENTICATION.INVALID_CREDENTIALS, 404)
      );

    if (!user.isVerified)
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_VERIFIED, 403)
      );
    const userResponse = {
      email: user.email,
      fullname: user.fullname,
      vendors: user.vendors, // Assuming vendorId is part of the User model
    };
    const token = generateJwt(user);
    userResponse.token = token;
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
export default {
  register,
  forgotPassword,
  verifyOtp,
  resendOtp,
  resetPassword,
  login,
};
