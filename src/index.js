import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import http from 'http';
import connectDB from './config/db.js';
// Load environment variables

// Server setup
const PORT = process.env.PORT;
const server = http.createServer(app);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Liquid-DMS is running on port ${PORT}`);
  });
});
