import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(process.env.MONGO_URI);

    console.log('DB connected: ' + connection.getClient().s.url);
  } catch (error) {
    console.log('Error connecting database: ' + error);
    process.exit(1);
  }
};

export default connectDB;
