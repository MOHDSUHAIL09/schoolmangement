import mongoose from 'mongoose';
import { ENV } from './env.js';
import { logger } from '../utils/logger.js';

let memServer = null;

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    logger.db(`Connecting to MongoDB at: ${ENV.MONGO_URI}...`);
    
    // Attempt standard connection with 4-second timeout
    await mongoose.connect(ENV.MONGO_URI, {
      serverSelectionTimeoutMS: 4000
    });
    
    logger.db(`MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    logger.warn(`Could not connect to external MongoDB: ${err.message}`);
    
    if (ENV.NODE_ENV !== 'production') {
      try {
        logger.info('Attempting fallback: starting local in-memory MongoDB instance for development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memServer = await MongoMemoryServer.create({
          instance: { dbName: 'school_management' }
        });
        const uri = memServer.getUri();
        await mongoose.connect(uri);
        logger.db(`Connected to in-memory MongoDB at: ${uri}`);
        logger.info('In-memory MongoDB is active. Seed data can be safely populated.');
        return;
      } catch (memErr) {
        logger.error('Failed to start in-memory MongoDB fallback', memErr);
      }
    }
    logger.error('Database connection failed. Please ensure MongoDB is running or provide a valid MONGO_URI in .env');
    throw err;
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (memServer) {
    await memServer.stop();
  }
};
