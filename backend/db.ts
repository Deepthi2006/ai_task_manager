import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('Error: MONGO_URI environment variable is not set!');
      console.error('Please add MONGO_URI to your .env file');
      throw new Error('MONGO_URI not set in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
