
import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);

    if (!ENV.MONGO_URI) {
      throw new Error('MONGO_URI is missing');
    }

    logger.info('Connecting to MongoDB Atlas...');

    await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 15000
    });

    logger.info(
      `MongoDB Atlas Connected: ${mongoose.connection.host}/${mongoose.connection.name}`
    );
  } catch (error) {
    logger.error(`MongoDB Connection Failed: ${error.message}`);
    throw error;
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
};
