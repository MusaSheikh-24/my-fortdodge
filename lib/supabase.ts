import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

// Use validated environment variables
const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

// Create a custom fetch with increased timeout for server-side requests
// This helps handle slow network connections or temporary Supabase service issues
const createCustomFetch = (): typeof fetch | undefined => {
  // Only use custom fetch on server-side (Node.js)
  if (typeof window !== 'undefined') {
    return undefined; // Use default fetch in browser
  }

  const customFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // Increase timeout to 30 seconds (default Node.js fetch timeout is 10 seconds)
    // AbortController is available in Node.js 15+
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(input, {
        ...init,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Re-throw with more context for timeout errors
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const timeoutError = new Error(`Request timeout after 30 seconds: ${urlString}`);
        (timeoutError as any).isTimeout = true;
        throw timeoutError;
      }
      throw error;
    }
  };

  return customFetch;
};

// Create a single supabase client for the entire project
// Use custom fetch with increased timeout for better reliability on server-side
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: createCustomFetch(),
  },
});
