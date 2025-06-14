import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const generateAndSetJwtCookie = (user, res) => {
  // Generate JWT

  console.log("JwT Scecret:", process.env.JWT_SECRET);
  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Token expires in 1 hour
  );
  // Set cookie with JWT
  res.cookie("jwt", token, {
    httpOnly: true, // Prevents client-side JavaScript access
    secure: process.env.NODE_ENV === "production", // Use secure in production
    sameSite: "strict", // Protects against CSRF
    maxAge: 3600000, // 1 hour in milliseconds
  });

  return token; // Optional: return token if needed elsewhere
};

export default generateAndSetJwtCookie;
