import { storage } from '../storage';

export class PaymentError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isRetryable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isRetryable: boolean = false,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
    this.context = context;
  }
}

export class PlaidError extends PaymentError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'PLAID_ERROR', 400, false, context);
    this.name = 'PlaidError';
  }
}

export class StripeError extends PaymentError {
  constructor(message: string, isRetryable: boolean = false, context?: Record<string, any>) {
    super(message, 'STRIPE_ERROR', 400, isRetryable, context);
    this.name = 'StripeError';
  }
}

export class StrikeError extends PaymentError {
  constructor(message: string, isRetryable: boolean = true, context?: Record<string, any>) {
    super(message, 'STRIKE_ERROR', 400, isRetryable, context);
    this.name = 'StrikeError';
  }
}

export class BreezError extends PaymentError {
  constructor(message: string, isRetryable: boolean = true, context?: Record<string, any>) {
    super(message, 'BREEZ_ERROR', 400, isRetryable, context);
    this.name = 'BreezError';
  }
}

export class ValidationError extends PaymentError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, false, context);
    this.name = 'ValidationError';
  }
}

export class InsufficientFundsError extends PaymentError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'INSUFFICIENT_FUNDS', 400, false, context);
    this.name = 'InsufficientFundsError';
  }
}

export class WalletNotFoundError extends PaymentError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'WALLET_NOT_FOUND', 404, false, context);
    this.name = 'WalletNotFoundError';
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry non-retryable errors
      if (error instanceof PaymentError && !error.isRetryable) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Rate limiter
 */
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}

  async checkLimit(): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Remove old requests
    this.requests = this.requests.filter(time => time > windowStart);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }

  getRemainingRequests(): number {
    return Math.max(0, this.maxRequests - this.requests.length);
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;
    return this.requests[0] + this.windowMs;
  }
}

/**
 * Error logging and monitoring
 */
export class ErrorLogger {
  static async logError(
    error: Error,
    context: Record<string, any> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error instanceof PaymentError ? error.code : 'UNKNOWN',
        statusCode: error instanceof PaymentError ? error.statusCode : 500,
        isRetryable: error instanceof PaymentError ? error.isRetryable : false,
        context,
        severity,
        timestamp: new Date().toISOString(),
      };

      console.error('Payment Error:', errorLog);

      // Store in database for monitoring
      await storage.createWebhookEvent({
        provider: 'system',
        eventType: 'error',
        eventId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payload: JSON.stringify(errorLog),
        processed: false,
        createdAt: new Date(),
      });

      // Alert on critical errors
      if (severity === 'critical') {
        console.error('CRITICAL ERROR ALERT:', errorLog);
        // TODO: Send alert to monitoring service (e.g., Sentry, PagerDuty)
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  static async logPaymentEvent(
    eventType: string,
    data: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    try {
      const eventLog = {
        eventType,
        data,
        severity,
        timestamp: new Date().toISOString(),
      };

      console.log('Payment Event:', eventLog);

      // Store in database
      await storage.createWebhookEvent({
        provider: 'system',
        eventType: 'payment_event',
        eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        payload: JSON.stringify(eventLog),
        processed: false,
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error('Failed to log payment event:', logError);
    }
  }
}

/**
 * Health check utilities
 */
export class HealthChecker {
  static async checkPaymentSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, { status: 'pass' | 'fail'; message?: string }>;
    timestamp: string;
  }> {
    const checks: Record<string, { status: 'pass' | 'fail'; message?: string }> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check database connectivity
    try {
      await storage.getWebhookEvents(undefined, undefined);
      checks.database = { status: 'pass' };
    } catch (error) {
      checks.database = { status: 'fail', message: 'Database connection failed' };
      overallStatus = 'unhealthy';
    }

    // Check recent webhook processing
    try {
      const recentEvents = await storage.getWebhookEvents(undefined, undefined);
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = recentEvents.filter(event => 
        new Date(event.createdAt) > lastHour
      ).length;
      
      const failedCount = recentEvents.filter(event => 
        event.error && new Date(event.createdAt) > lastHour
      ).length;

      if (failedCount > recentCount * 0.1) { // More than 10% failure rate
        checks.webhookProcessing = { 
          status: 'fail', 
          message: `High failure rate: ${failedCount}/${recentCount} events failed` 
        };
        overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
      } else {
        checks.webhookProcessing = { status: 'pass' };
      }
    } catch (error) {
      checks.webhookProcessing = { status: 'fail', message: 'Failed to check webhook processing' };
      overallStatus = 'unhealthy';
    }

    // Check unprocessed events
    try {
      const unprocessedEvents = await storage.getWebhookEvents(undefined, false);
      const oldUnprocessed = unprocessedEvents.filter(event => 
        new Date(event.createdAt) < new Date(Date.now() - 5 * 60 * 1000) // 5 minutes old
      );

      if (oldUnprocessed.length > 10) {
        checks.unprocessedEvents = { 
          status: 'fail', 
          message: `${oldUnprocessed.length} old unprocessed events` 
        };
        overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
      } else {
        checks.unprocessedEvents = { status: 'pass' };
      }
    } catch (error) {
      checks.unprocessedEvents = { status: 'fail', message: 'Failed to check unprocessed events' };
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Global error handler for Express
 */
export function createErrorHandler() {
  return (error: Error, req: any, res: any, next: any) => {
    // Log the error
    ErrorLogger.logError(error, {
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    });

    // Determine status code
    const statusCode = error instanceof PaymentError ? error.statusCode : 500;
    
    // Send error response
    res.status(statusCode).json({
      error: error.message,
      code: error instanceof PaymentError ? error.code : 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  };
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(fn: Function) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
