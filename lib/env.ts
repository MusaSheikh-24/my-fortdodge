/**
 * Environment variable validation and configuration
 * 
 * This module validates all required environment variables at startup
 * and provides type-safe access to environment configuration.
 */

interface EnvConfig {
  // Supabase (Required)
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string; // Optional but recommended
  };
  
  // Site Configuration (Optional with defaults)
  site: {
    url: string;
  };
  
  // Email Configuration (Optional)
  email?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    from?: string;
    to?: string;
  };
}

/**
 * Validates and returns environment configuration
 * Throws an error if required variables are missing
 */
export function validateEnv(): EnvConfig {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required Supabase variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
  } else if (!isValidUrl(supabaseUrl)) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL must be a valid URL");
  }

  if (!supabaseAnonKey) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
  } else if (supabaseAnonKey.length < 20) {
    errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)");
  }

  if (!supabaseServiceKey) {
    warnings.push(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Some admin features (image uploads) may not work properly."
    );
  } else if (supabaseServiceKey.length < 20) {
    warnings.push("SUPABASE_SERVICE_ROLE_KEY appears to be invalid (too short)");
  }

  // Optional site URL with default
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://arqum.org";
  if (siteUrl && !isValidUrl(siteUrl)) {
    warnings.push("NEXT_PUBLIC_SITE_URL is not a valid URL, using default");
  }

  // Optional email configuration
  const emailConfig: EnvConfig["email"] = {};
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const emailFrom = process.env.EMAIL_FROM;
  const emailTo = process.env.EMAIL_TO;

  // If any email config is provided, validate all required parts
  if (smtpHost || smtpUser || smtpPass || emailFrom || emailTo) {
    const missingFields: string[] = [];
    
    if (!smtpHost) {
      missingFields.push("SMTP_HOST");
      warnings.push("SMTP_HOST is missing but other email config is present");
    }
    if (!smtpUser) {
      missingFields.push("SMTP_USER");
      warnings.push("SMTP_USER is missing but other email config is present");
    }
    if (!smtpPass) {
      missingFields.push("SMTP_PASS");
      warnings.push("SMTP_PASS is missing but other email config is present");
    }
    if (!emailFrom) {
      missingFields.push("EMAIL_FROM");
      warnings.push("EMAIL_FROM is missing but other email config is present");
    }
    if (!emailTo) {
      missingFields.push("EMAIL_TO");
      warnings.push("EMAIL_TO is missing but other email config is present");
    }

    if (missingFields.length > 0) {
      warnings.push(
        `Email configuration is incomplete. Missing: ${missingFields.join(", ")}. ` +
        `Email functionality will be disabled until all required fields are set.`
      );
    }

    if (smtpHost && smtpUser && smtpPass && emailFrom && emailTo) {
      emailConfig.smtpHost = smtpHost;
      emailConfig.smtpPort = smtpPort ? parseInt(smtpPort, 10) : 587;
      emailConfig.smtpUser = smtpUser;
      emailConfig.smtpPass = smtpPass;
      emailConfig.from = emailFrom;
      emailConfig.to = emailTo;
    }
  }

  // Log warnings (non-blocking)
  if (warnings.length > 0) {
    console.warn("[env] Environment variable warnings:");
    warnings.forEach((warning) => console.warn(`  ⚠️  ${warning}`));
  }

  // Throw errors (blocking)
  if (errors.length > 0) {
    console.error("[env] Environment variable validation failed:");
    errors.forEach((error) => console.error(`  ❌ ${error}`));
    console.error("\nPlease check your .env.local file and ensure all required variables are set.");
    throw new Error(
      `Missing or invalid required environment variables:\n${errors.join("\n")}`
    );
  }

  const config: EnvConfig = {
    supabase: {
      url: supabaseUrl!,
      anonKey: supabaseAnonKey!,
      ...(supabaseServiceKey && { serviceRoleKey: supabaseServiceKey }),
    },
    site: {
      url: siteUrl,
    },
    ...(Object.keys(emailConfig).length > 0 && { email: emailConfig }),
  };

  console.log("[env] ✅ Environment variables validated successfully");
  if (supabaseServiceKey) {
    console.log("[env] ✅ Service role key is configured (admin features enabled)");
  }
  if (emailConfig.smtpHost) {
    console.log("[env] ✅ Email configuration is set up");
  }

  return config;
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get validated environment configuration
 * This will throw an error if required variables are missing
 */
let cachedConfig: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Only validate on server-side
  if (typeof window === "undefined") {
    cachedConfig = validateEnv();
    return cachedConfig;
  }

  // On client-side, return minimal config (only public vars)
  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
    site: {
      url: process.env.NEXT_PUBLIC_SITE_URL || "https://arqum.org",
    },
  };
}

/**
 * Type-safe environment variable getters
 */
export const env = {
  /**
   * Get Supabase URL (required)
   */
  get supabaseUrl(): string {
    const config = getEnv();
    if (!config.supabase.url) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
    }
    return config.supabase.url;
  },

  /**
   * Get Supabase anonymous key (required)
   */
  get supabaseAnonKey(): string {
    const config = getEnv();
    if (!config.supabase.anonKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
    }
    return config.supabase.anonKey;
  },

  /**
   * Get Supabase service role key (optional)
   */
  get supabaseServiceRoleKey(): string | undefined {
    const config = getEnv();
    return config.supabase.serviceRoleKey;
  },

  /**
   * Get site URL (with default)
   */
  get siteUrl(): string {
    const config = getEnv();
    return config.site.url;
  },

  /**
   * Get email configuration (optional)
   */
  get email(): EnvConfig["email"] {
    const config = getEnv();
    return config.email;
  },

  /**
   * Check if email is configured
   */
  get isEmailConfigured(): boolean {
    const config = getEnv();
    return !!(
      config.email?.smtpHost &&
      config.email?.smtpUser &&
      config.email?.smtpPass &&
      config.email?.from &&
      config.email?.to
    );
  },

  /**
   * Check if service role key is configured
   */
  get isServiceRoleConfigured(): boolean {
    const config = getEnv();
    return !!config.supabase.serviceRoleKey;
  },
};

