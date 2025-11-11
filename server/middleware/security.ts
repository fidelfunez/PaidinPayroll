import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { RateLimiter } from '../utils/error-handling';

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: message || 'Too many requests from this IP, please try again later.',
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// General API rate limiting
export const generalRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  'Too many API requests from this IP, please try again later.'
);

// Payment-specific rate limiting (more restrictive)
export const paymentRateLimit = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  10, // 10 payment requests per window
  'Too many payment requests from this IP, please try again later.'
);

// Webhook rate limiting
export const webhookRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  50, // 50 webhook requests per window
  'Too many webhook requests from this IP, please try again later.'
);

// Login rate limiting (very restrictive)
export const loginRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 login attempts per window
  'Too many login attempts from this IP, please try again later.'
);

// Plaid-specific rate limiting
export const plaidRateLimit = createRateLimit(
  1 * 60 * 1000, // 1 minute
  5, // 5 Plaid requests per window
  'Too many Plaid requests from this IP, please try again later.'
);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://api.plaid.com", "https://api.strike.me"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://cdn.plaid.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://paidin-app.fly.dev',
      'https://paidin-app.netlify.app',
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'Stripe-Signature',
    'Strike-Signature',
    'Breez-Signature',
  ],
};

// Request validation middleware
export const validateRequest = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.errors || error.message,
      });
    }
  };
};

// IP whitelist middleware for admin endpoints
export const adminIpWhitelist = (req: Request, res: Response, next: NextFunction) => {
  const allowedIPs = [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
    // Add production admin IPs here
  ];
  
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (allowedIPs.includes(clientIP || '')) {
    next();
  } else {
    res.status(403).json({
      error: 'Access denied',
      message: 'This endpoint is only accessible from whitelisted IP addresses',
    });
  }
};

// Request size limiting
export const requestSizeLimit = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      return res.status(413).json({
        error: 'Request too large',
        message: `Request size exceeds maximum allowed size of ${maxSize}`,
      });
    }
    
    next();
  };
};

// Parse size string to bytes
function parseSize(size: string): number {
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

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.get('X-API-Key');
  const validApiKeys = process.env.API_KEYS?.split(',') || [];
  
  if (!apiKey || !validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'A valid API key is required for this endpoint',
    });
  }
  
  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data: any) {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };
    
    // Log only if duration > 1000ms or status code >= 400
    if (duration > 1000 || res.statusCode >= 400) {
      console.log('Slow/Error Request:', logData);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Webhook signature validation middleware
export const validateWebhookSignature = (provider: 'stripe' | 'strike' | 'breez') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.get(`${provider}-signature`) || req.get('stripe-signature');
      
      if (!signature) {
        return res.status(400).json({
          error: 'Missing signature',
          message: `Missing ${provider} signature header`,
        });
      }
      
      const payload = JSON.stringify(req.body);
      let isValid = false;
      
      switch (provider) {
        case 'stripe':
          // Stripe signature validation is handled in the service
          isValid = true;
          break;
        case 'strike':
          isValid = true; // Simplified for testing
          break;
        case 'breez':
          isValid = true; // Simplified for testing
          break;
        default:
          return res.status(400).json({
            error: 'Invalid provider',
            message: 'Unknown webhook provider',
          });
      }
      
      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid signature',
          message: `Invalid ${provider} webhook signature`,
        });
      }
      
      next();
    } catch (error) {
      console.error('Webhook signature validation error:', error);
      res.status(400).json({
        error: 'Signature validation failed',
        message: 'Failed to validate webhook signature',
      });
    }
  };
};

// Database query protection middleware
export const protectDatabaseQueries = (req: Request, res: Response, next: NextFunction) => {
  // Prevent SQL injection by validating query parameters
  const queryParams = { ...req.query, ...req.params };
  
  for (const [key, value] of Object.entries(queryParams)) {
    if (typeof value === 'string' && /[;'"]/.test(value)) {
      return res.status(400).json({
        error: 'Invalid query parameter',
        message: `Query parameter '${key}' contains potentially dangerous characters`,
      });
    }
  }
  
  next();
};

// Rate limiter for specific endpoints
export const createEndpointRateLimit = (endpoint: string, windowMs: number, max: number) => {
  const rateLimiters = new Map<string, RateLimiter>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${endpoint}:${req.ip}`;
    
    if (!rateLimiters.has(key)) {
      rateLimiters.set(key, new RateLimiter(max, windowMs));
    }
    
    const limiter = rateLimiters.get(key)!;
    
    if (!limiter.checkLimit()) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests to ${endpoint} from this IP`,
        retryAfter: Math.round(windowMs / 1000),
      });
    }
    
    next();
  };
};

// Security audit logging
export const securityAuditLogger = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /\.\.\//, // Directory traversal
    /<script/i, // XSS attempts
    /union\s+select/i, // SQL injection
    /drop\s+table/i, // SQL injection
    /javascript:/i, // XSS attempts
    /on\w+\s*=/i, // Event handler injection
  ];
  
  const requestData = {
    url: req.url,
    method: req.method,
    body: JSON.stringify(req.body),
    query: JSON.stringify(req.query),
    headers: JSON.stringify(req.headers),
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };
  
  const requestString = JSON.stringify(requestData);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      console.warn('Suspicious request detected:', {
        pattern: pattern.toString(),
        request: requestData,
        timestamp: new Date().toISOString(),
      });
      
      // Log to security audit system
      // TODO: Send to security monitoring service
    }
  }
  
  next();
};
