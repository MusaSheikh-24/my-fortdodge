/**
 * Environment variable validation on app startup
 * 
 * This module validates environment variables when the app starts.
 * Import this in your root layout or a startup file to ensure
 * all required variables are present before the app runs.
 */

import { validateEnv } from './env';

/**
 * Validates environment variables on module load (server-side only)
 * This will throw an error if required variables are missing
 */
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // Log the error but don't crash the app in development
    // In production, this should fail fast
    if (process.env.NODE_ENV === 'production') {
      console.error('[validate-env] Fatal: Missing required environment variables');
      throw error;
    } else {
      console.error('[validate-env] Warning: Environment validation failed');
      console.error(error);
    }
  }
}

