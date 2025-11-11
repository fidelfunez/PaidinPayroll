import { z } from 'zod';

// Security configuration schema
export const securityConfigSchema = z.object({
  // Rate limiting
  rateLimits: z.object({
    general: z.object({
      windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
      max: z.number().default(100),
    }),
    payment: z.object({
      windowMs: z.number().default(5 * 60 * 1000), // 5 minutes
      max: z.number().default(10),
    }),
    webhook: z.object({
      windowMs: z.number().default(1 * 60 * 1000), // 1 minute
      max: z.number().default(50),
    }),
    login: z.object({
      windowMs: z.number().default(15 * 60 * 1000), // 15 minutes
      max: z.number().default(5),
    }),
    plaid: z.object({
      windowMs: z.number().default(1 * 60 * 1000), // 1 minute
      max: z.number().default(5),
    }),
  }),
  
  // CORS configuration
  cors: z.object({
    allowedOrigins: z.array(z.string()).default([
      'http://localhost:3000',
      'http://localhost:5173',
      'https://paidin-app.fly.dev',
      'https://paidin-app.netlify.app',
    ]),
    credentials: z.boolean().default(true),
  }),
  
  // Request size limits
  requestLimits: z.object({
    maxSize: z.string().default('10mb'),
    maxJsonSize: z.string().default('1mb'),
    maxUrlSize: z.string().default('2kb'),
  }),
  
  // Security headers
  securityHeaders: z.object({
    contentSecurityPolicy: z.boolean().default(true),
    hsts: z.boolean().default(true),
    noSniff: z.boolean().default(true),
    xssProtection: z.boolean().default(true),
    frameOptions: z.boolean().default(true),
  }),
  
  // API key configuration
  apiKeys: z.object({
    enabled: z.boolean().default(false),
    keys: z.array(z.string()).default([]),
    headerName: z.string().default('X-API-Key'),
  }),
  
  // IP whitelisting
  ipWhitelist: z.object({
    enabled: z.boolean().default(false),
    allowedIPs: z.array(z.string()).default(['127.0.0.1', '::1']),
    adminOnly: z.boolean().default(true),
  }),
  
  // Encryption
  encryption: z.object({
    algorithm: z.string().default('aes-256-gcm'),
    keyLength: z.number().default(32),
    ivLength: z.number().default(16),
  }),
  
  // Session security
  session: z.object({
    secure: z.boolean().default(process.env.NODE_ENV === 'production'),
    httpOnly: z.boolean().default(true),
    sameSite: z.enum(['strict', 'lax', 'none']).default('lax'),
    maxAge: z.number().default(24 * 60 * 60 * 1000), // 24 hours
  }),
  
  // Webhook security
  webhooks: z.object({
    signatureValidation: z.boolean().default(true),
    timestampValidation: z.boolean().default(true),
    maxAge: z.number().default(5 * 60 * 1000), // 5 minutes
  }),
  
  // Audit logging
  audit: z.object({
    enabled: z.boolean().default(true),
    logLevel: z.enum(['low', 'medium', 'high']).default('medium'),
    suspiciousPatterns: z.array(z.string()).default([
      '\.\.\/', // Directory traversal
      '<script', // XSS attempts
      'union\s+select', // SQL injection
      'drop\s+table', // SQL injection
      'javascript:', // XSS attempts
      'on\w+\s*=', // Event handler injection
    ]),
  }),
});

// Default security configuration
export const defaultSecurityConfig = {
  rateLimits: {
    general: { windowMs: 15 * 60 * 1000, max: 100 },
    payment: { windowMs: 5 * 60 * 1000, max: 10 },
    webhook: { windowMs: 1 * 60 * 1000, max: 50 },
    login: { windowMs: 15 * 60 * 1000, max: 5 },
    plaid: { windowMs: 1 * 60 * 1000, max: 5 },
  },
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://paidin-app.fly.dev',
      'https://paidin-app.netlify.app',
    ],
    credentials: true,
  },
  requestLimits: {
    maxSize: '10mb',
    maxJsonSize: '1mb',
    maxUrlSize: '2kb',
  },
  securityHeaders: {
    contentSecurityPolicy: true,
    hsts: true,
    noSniff: true,
    xssProtection: true,
    frameOptions: true,
  },
  apiKeys: {
    enabled: false,
    keys: [],
    headerName: 'X-API-Key',
  },
  ipWhitelist: {
    enabled: false,
    allowedIPs: ['127.0.0.1', '::1'],
    adminOnly: true,
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
  },
  session: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 24 * 60 * 60 * 1000,
  },
  webhooks: {
    signatureValidation: true,
    timestampValidation: true,
    maxAge: 5 * 60 * 1000,
  },
  audit: {
    enabled: true,
    logLevel: 'medium' as const,
    suspiciousPatterns: [
      '\.\.\/',
      '<script',
      'union\s+select',
      'drop\s+table',
      'javascript:',
      'on\w+\s*=',
    ],
  },
};

// Load security configuration from environment
export function loadSecurityConfig() {
  try {
    const config = {
      rateLimits: {
        general: {
          windowMs: parseInt(process.env.RATE_LIMIT_GENERAL_WINDOW || '900000'),
          max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || '100'),
        },
        payment: {
          windowMs: parseInt(process.env.RATE_LIMIT_PAYMENT_WINDOW || '300000'),
          max: parseInt(process.env.RATE_LIMIT_PAYMENT_MAX || '10'),
        },
        webhook: {
          windowMs: parseInt(process.env.RATE_LIMIT_WEBHOOK_WINDOW || '60000'),
          max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '50'),
        },
        login: {
          windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '900000'),
          max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),
        },
        plaid: {
          windowMs: parseInt(process.env.RATE_LIMIT_PLAID_WINDOW || '60000'),
          max: parseInt(process.env.RATE_LIMIT_PLAID_MAX || '5'),
        },
      },
      cors: {
        allowedOrigins: process.env.CORS_ALLOWED_ORIGINS?.split(',') || defaultSecurityConfig.cors.allowedOrigins,
        credentials: process.env.CORS_CREDENTIALS !== 'false',
      },
      requestLimits: {
        maxSize: process.env.REQUEST_MAX_SIZE || defaultSecurityConfig.requestLimits.maxSize,
        maxJsonSize: process.env.REQUEST_MAX_JSON_SIZE || defaultSecurityConfig.requestLimits.maxJsonSize,
        maxUrlSize: process.env.REQUEST_MAX_URL_SIZE || defaultSecurityConfig.requestLimits.maxUrlSize,
      },
      securityHeaders: {
        contentSecurityPolicy: process.env.SECURITY_CSP !== 'false',
        hsts: process.env.SECURITY_HSTS !== 'false',
        noSniff: process.env.SECURITY_NO_SNIFF !== 'false',
        xssProtection: process.env.SECURITY_XSS_PROTECTION !== 'false',
        frameOptions: process.env.SECURITY_FRAME_OPTIONS !== 'false',
      },
      apiKeys: {
        enabled: process.env.API_KEYS_ENABLED === 'true',
        keys: process.env.API_KEYS?.split(',') || [],
        headerName: process.env.API_KEY_HEADER || 'X-API-Key',
      },
      ipWhitelist: {
        enabled: process.env.IP_WHITELIST_ENABLED === 'true',
        allowedIPs: process.env.IP_WHITELIST?.split(',') || defaultSecurityConfig.ipWhitelist.allowedIPs,
        adminOnly: process.env.IP_WHITELIST_ADMIN_ONLY !== 'false',
      },
      encryption: {
        algorithm: process.env.ENCRYPTION_ALGORITHM || defaultSecurityConfig.encryption.algorithm,
        keyLength: parseInt(process.env.ENCRYPTION_KEY_LENGTH || '32'),
        ivLength: parseInt(process.env.ENCRYPTION_IV_LENGTH || '16'),
      },
      session: {
        secure: process.env.SESSION_SECURE === 'true' || process.env.NODE_ENV === 'production',
        httpOnly: process.env.SESSION_HTTP_ONLY !== 'false',
        sameSite: (process.env.SESSION_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax',
        maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
      },
      webhooks: {
        signatureValidation: process.env.WEBHOOK_SIGNATURE_VALIDATION !== 'false',
        timestampValidation: process.env.WEBHOOK_TIMESTAMP_VALIDATION !== 'false',
        maxAge: parseInt(process.env.WEBHOOK_MAX_AGE || '300000'),
      },
      audit: {
        enabled: process.env.AUDIT_ENABLED !== 'false',
        logLevel: (process.env.AUDIT_LOG_LEVEL as 'low' | 'medium' | 'high') || 'medium',
        suspiciousPatterns: process.env.AUDIT_SUSPICIOUS_PATTERNS?.split(',') || defaultSecurityConfig.audit.suspiciousPatterns,
      },
    };

    return securityConfigSchema.parse(config);
  } catch (error) {
    console.error('Invalid security configuration:', error);
    return defaultSecurityConfig;
  }
}

// Security validation utilities
export class SecurityValidator {
  private static config = loadSecurityConfig();

  static validateApiKey(apiKey: string | undefined): boolean {
    if (!this.config.apiKeys.enabled) return true;
    return apiKey ? this.config.apiKeys.keys.includes(apiKey) : false;
  }

  static validateIP(ip: string | undefined, isAdmin: boolean = false): boolean {
    if (!this.config.ipWhitelist.enabled) return true;
    if (isAdmin && !this.config.ipWhitelist.adminOnly) return true;
    return ip ? this.config.ipWhitelist.allowedIPs.includes(ip) : false;
  }

  static validateOrigin(origin: string | undefined): boolean {
    return origin ? this.config.cors.allowedOrigins.includes(origin) : true;
  }

  static validateRequestSize(contentLength: number): boolean {
    const maxSize = this.parseSize(this.config.requestLimits.maxSize);
    return contentLength <= maxSize;
  }

  static validateWebhookTimestamp(timestamp: number): boolean {
    if (!this.config.webhooks.timestampValidation) return true;
    const now = Date.now();
    const maxAge = this.config.webhooks.maxAge;
    return Math.abs(now - timestamp) <= maxAge;
  }

  static isSuspiciousRequest(requestData: string): boolean {
    if (!this.config.audit.enabled) return false;
    
    for (const pattern of this.config.audit.suspiciousPatterns) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(requestData)) {
        return true;
      }
    }
    
    return false;
  }

  private static parseSize(size: string): number {
    const units: { [key: string]: number } = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };
    
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    return Math.floor(value * units[unit]);
  }
}

// Security audit logger
export class SecurityAuditLogger {
  static logSuspiciousActivity(
    type: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const auditLog = {
      type,
      details,
      severity,
      timestamp: new Date().toISOString(),
      ip: details.ip,
      userAgent: details.userAgent,
    };

    console.warn('Security Audit:', auditLog);

    // TODO: Send to security monitoring service (e.g., Sentry, DataDog)
    if (severity === 'critical' || severity === 'high') {
      console.error('HIGH PRIORITY SECURITY ALERT:', auditLog);
    }
  }

  static logRateLimitExceeded(
    endpoint: string,
    ip: string,
    userAgent: string,
    attempts: number
  ): void {
    this.logSuspiciousActivity('rate_limit_exceeded', {
      endpoint,
      ip,
      userAgent,
      attempts,
    }, 'medium');
  }

  static logInvalidApiKey(ip: string, userAgent: string, apiKey: string): void {
    this.logSuspiciousActivity('invalid_api_key', {
      ip,
      userAgent,
      apiKey: apiKey.substring(0, 8) + '...', // Only log partial key
    }, 'high');
  }

  static logSuspiciousRequest(
    pattern: string,
    requestData: Record<string, any>,
    ip: string,
    userAgent: string
  ): void {
    this.logSuspiciousActivity('suspicious_request', {
      pattern,
      requestData,
      ip,
      userAgent,
    }, 'high');
  }

  static logWebhookValidationFailure(
    provider: string,
    reason: string,
    ip: string,
    userAgent: string
  ): void {
    this.logSuspiciousActivity('webhook_validation_failure', {
      provider,
      reason,
      ip,
      userAgent,
    }, 'medium');
  }
}
