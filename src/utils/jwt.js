import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const generateJwt = (user) => {
  // Generate JWT

  console.log('JwT Scecret:', process.env.JWT_SECRET);
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 1 hour
  );
  // Cookie setting removed; return token for client-side storage
  return token;
};

export default generateJwt;
