import User from '../models/user.js';

import otpUtils from '../utils/Otp.js';
import sendEmail from '../utils/sendEmail.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import errorConstants from '../utils/errors.js';
import ApiError from '../utils/ApiError.js';
import generateAndSetJwtCookie from '../utils/jwt.js';
const register = async (req, res, next) => {
  try {
    const { fullname, email, password } = req.body;

    const userExists = await User.findOne({ email }).lean();
    if (userExists) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_ALREADY_EXISTS)
      );
    }
    await otpUtils.clearOtpCache(email);

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
      'User registed successfully',
      res
    );
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).lean();
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

    const isFirstTime = !(await otpUtils.hasRequestedBefore(email));
    if (!isFirstTime) {
      const track = await otpUtils.trackRequest(email);
      if (!track.allowed)
        return res.status(429).json({ message: track.message });
    }

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

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return next(
        new ApiError(errorConstants.AUTHENTICATION.USER_NOT_VERIFIED, 403)
      );
    }
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
const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).lean();
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

    const user = await User.findOne({ email });
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
    const token = generateAndSetJwtCookie(userResponse, res); // ✅ pass userResponse here
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
