/**
 * Database Configuration
 * SQLite database configuration
 */

import path from 'path';
import { appConfig } from './app.config';

export const databaseConfig = {
  // Database file path
  databasePath: path.join(process.cwd(), 'data', 'dashboard.db'),
  
  // Database options
  options: {
    verbose: appConfig.isDevelopment ? console.log : undefined,
  },
};

export default databaseConfig;

