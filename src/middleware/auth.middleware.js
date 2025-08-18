import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import errorConstants from '../utils/errors.js';

export const verifyToken = (req, res, next) => {
  try {
    console.log('🔍 Debug - Authorization header:', req.headers?.authorization);

    const token = req.headers?.authorization?.replace('Bearer ', '');
    console.log(
      '🔍 Debug - Extracted token:',
      token ? 'Token exists' : 'No token'
    );

    if (!token) {
      console.log('❌ No token found in Authorization header');
      return next(
        new ApiError(errorConstants.AUTHENTICATION.TOKEN_MISSING, 401)
      );
    }

    console.log(
      '🔍 Debug - About to verify token with secret:',
      process.env.JWT_SECRET ? 'Secret exists' : 'No secret'
    );

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔍 Debug - Token decoded successfully:', decoded);

    req.user = decoded; // e.g. { userId: ..., email: ..., etc }
    console.log('🔍 Debug - Set req.user to:', req.user);

    next();
  } catch (err) {
    console.log('❌ Token verification failed:', err.message);
    return next(
      new ApiError(
        errorConstants.AUTHENTICATION.TOKEN_INVALID || err.message,
        403
      )
    );
  }
};
