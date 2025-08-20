import User from '../models/user.js';
import ApiError from '../utils/ApiError.js';
import SuccessHandler from '../utils/SuccessHandler.js';
import logger from '../functions/logger.js';
import { getFullImageUrl } from '../utils/url.js';
import { updateProfileAndPasswordSchema } from '../validations/profile.validation.js';

// Helper function to normalize email consistently

// ✅ Get User Profile
export const getUserProfile = async (req, res, next) => {
  try {
    logger.info('👤 Get user profile request received');

    // Debug: Log what's in req.user from verifyToken middleware
    console.log('🔍 Debug - req.user from verifyToken:', req.user);
    console.log('🔍 Debug - req.user.userId:', req.user?.userId);
    console.log('🔍 Debug - req.user._id:', req.user?._id);
    console.log('🔍 Debug - req.user.id:', req.user?.id);

    // Get user ID from the authenticated request (set by auth middleware)
    let userId = req.user?.userId || req.user?._id || req.user?.id;

    // Fallback: if no userId in token, try to find user by email
    if (!userId && req.user?.email) {
      console.log(
        '⚠️ No userId in token, trying to find user by email:',
        req.user.email
      );
      const userByEmail = await User.findOne({ email: req.user.email }).select(
        '_id'
      );
      if (userByEmail) {
        userId = userByEmail._id;
        console.log('✅ Found user by email, userId:', userId);
      }
    }

    if (!userId) {
      console.log('❌ No user ID found in req.user object');
      return next(new ApiError('User ID not found in request', 400));
    }

    console.log('✅ Found user ID:', userId);

    // Find user by ID
    const user = await User.findById(userId).select('-password');
    if (!user) {
      logger.warn({
        message: `❌ User not found: ${userId}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('User not found', 404));
    }

    // Structure the response (fallback to default image if none)
    const defaultProfileUrl = getFullImageUrl('default-profile.png');
    const profileImageUrl =
      typeof user.profileImage === 'string' && user.profileImage.trim() !== ''
        ? user.profileImage
        : defaultProfileUrl;

    const profileResponse = {
      fullname: user.fullname,
      email: user.email,
      gender: user.gender,
      phone: user.phone,
      address: user.address,
      zipCode: user.zipCode,
      language: user.language,
      profileImage: profileImageUrl,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    logger.info({
      message: `✅ User profile retrieved successfully for user: ${userId}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      profileResponse,
      200,
      'User profile retrieved successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Get user profile error:', error);
    next(new ApiError(error.message || 'Internal Server Error', 500));
  }
};

// ✅ Update Profile and Password (Single endpoint for all updates including image)
export const updateProfileAndPassword = async (req, res, next) => {
  try {
    logger.info('✏️ Update profile and password request received');

    // Debug: Log what's in req.user from verifyToken middleware
    console.log('🔍 Debug - req.user from verifyToken:', req.user);
    console.log('🔍 Debug - req.user.userId:', req.user?.userId);
    console.log('🔍 Debug - req.user._id:', req.user?._id);
    console.log('🔍 Debug - req.user.id:', req.user?.id);

    // Get user ID from the authenticated request
    let userId = req.user?.userId || req.user?._id || req.user?.id;

    // Fallback: if no userId in token, try to find user by email
    if (!userId && req.user?.email) {
      console.log(
        '⚠️ No userId in token, trying to find user by email:',
        req.user.email
      );
      const userByEmail = await User.findOne({ email: req.user.email }).select(
        '_id'
      );
      if (userByEmail) {
        userId = userByEmail._id;
        console.log('✅ Found user by email, userId:', userId);
      }
    }

    if (!userId) {
      console.log('❌ No user ID found in req.user object');
      return next(new ApiError('User ID not found in request', 400));
    }

    console.log('✅ Found user ID:', userId);

    // Handle image upload if present
    if (req.file) {
      // Use the same pattern as other controllers
      const imageUrl = getFullImageUrl(req.file.filename);
      req.body.profileImage = imageUrl;
    }

    // Validate request body
    const { error, value } = updateProfileAndPasswordSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      logger.warn({
        message: `❌ Validation error: ${error.details.map((d) => d.message).join(', ')}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError(error.details[0].message, 400));
    }

    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      logger.warn({
        message: `❌ User not found: ${userId}`,
        timestamp: new Date().toISOString(),
      });
      return next(new ApiError('User not found', 404));
    }

    // Separate profile fields from password fields
    const profileFields = {};
    const passwordFields = {};

    Object.keys(value).forEach((key) => {
      if (value[key] !== undefined && value[key] !== null) {
        if (
          ['currentPassword', 'newPassword', 'confirmNewPassword'].includes(key)
        ) {
          passwordFields[key] = value[key];
        } else {
          profileFields[key] = value[key];
        }
      }
    });

    // Handle password change if password fields are provided
    if (passwordFields.currentPassword && passwordFields.newPassword) {
      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(
        passwordFields.currentPassword
      );
      if (!isCurrentPasswordValid) {
        logger.warn({
          message: `❌ Invalid current password for user: ${userId}`,
          timestamp: new Date().toISOString(),
        });
        return next(new ApiError('Current password is incorrect', 400));
      }

      // Update password
      user.password = passwordFields.newPassword;
    }

    // Update profile fields
    if (Object.keys(profileFields).length > 0) {
      // Special handling for email updates
      if (profileFields.email && profileFields.email !== user.email) {
        // Check if new email already exists
        const existingUser = await User.findOne({
          email: profileFields.email,
          _id: { $ne: userId }, // Exclude current user
        });

        if (existingUser) {
          logger.warn({
            message: `❌ Email already exists: ${profileFields.email}`,
            timestamp: new Date().toISOString(),
          });
          return next(new ApiError('Email address is already in use', 409));
        }

        // Email is being changed - you might want to set isVerified to false
        // and require email verification again
        profileFields.isVerified = false;
        logger.info({
          message: `📧 Email changed for user: ${userId}, verification required`,
          timestamp: new Date().toISOString(),
        });
      }

      Object.assign(user, profileFields);
    }

    // Save the user
    await user.save();

    // Get updated user without password
    const updatedUser = await User.findById(userId).select('-password');

    // Structure the response (fallback to default image if none)
    const defaultProfileUrl = getFullImageUrl('default-profile.png');
    const profileImageUrl =
      typeof updatedUser.profileImage === 'string' &&
      updatedUser.profileImage.trim() !== ''
        ? updatedUser.profileImage
        : defaultProfileUrl;

    // Structure the response
    const profileResponse = {
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      gender: updatedUser.gender,
      phone: updatedUser.phone,
      address: updatedUser.address,
      zipCode: updatedUser.zipCode,
      language: updatedUser.language,
      profileImage: profileImageUrl,
      isVerified: updatedUser.isVerified,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };

    logger.info({
      message: `✅ Profile and password updated successfully for user: ${userId}`,
      timestamp: new Date().toISOString(),
    });

    return SuccessHandler(
      profileResponse,
      200,
      'Profile updated successfully',
      res
    );
  } catch (error) {
    logger.error('❌ Update profile and password error:', error);
    next(new ApiError(error.message || 'Internal Server Error', 500));
  }
};
