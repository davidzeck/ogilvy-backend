/**
 * Database Initialization Script
 * Run this to initialize and seed the database
 */

import { initializeDatabase, seedDatabase, closeDatabase } from './database';
import logger from './logger';

const init = async () => {
  try {
    logger.info('Initializing database...');
    initializeDatabase();
    
    if (process.env.NODE_ENV === 'development' || process.argv.includes('--seed')) {
      seedDatabase();
    }
    
    logger.info('Database initialization complete');
    closeDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    closeDatabase();
    process.exit(1);
  }
};

init();

