import { storage } from '../storage';
import { ErrorLogger } from './error-handling';

export interface PaymentMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalVolumeUsd: number;
  totalVolumeBtc: number;
  averageTransactionSize: number;
  successRate: number;
  averageProcessingTime: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  activeConnections: number;
  queueStatus: {
    funding: { pending: number; processing: number; completed: number; failed: number };
    conversion: { pending: number; processing: number; completed: number; failed: number };
    payout: { pending: number; processing: number; completed: number; failed: number };
    webhook: { pending: number; processing: number; completed: number; failed: number };
  };
  webhookHealth: {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    averageProcessingTime: number;
  };
}

export class PaymentMonitor {
  private static instance: PaymentMonitor;
  private startTime: number = Date.now();
  private metrics: PaymentMetrics | null = null;
  private lastMetricsUpdate: number = 0;
  private readonly METRICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): PaymentMonitor {
    if (!PaymentMonitor.instance) {
      PaymentMonitor.instance = new PaymentMonitor();
    }
    return PaymentMonitor.instance;
  }

  /**
   * Get payment metrics for the specified time period
   */
  async getPaymentMetrics(days: number = 30): Promise<PaymentMetrics> {
    const now = Date.now();
    
    // Return cached metrics if still valid
    if (this.metrics && (now - this.lastMetricsUpdate) < this.METRICS_CACHE_TTL) {
      return this.metrics;
    }

    try {
      const startDate = new Date(now - days * 24 * 60 * 60 * 1000);
      
      // Get all webhook events for the period
      const allEvents = await storage.getWebhookEvents(undefined, undefined);
      const periodEvents = allEvents.filter(event => 
        new Date(event.createdAt) > startDate
      );

      // Calculate transaction metrics
      const paymentEvents = periodEvents.filter(event => 
        event.eventType.includes('payment_intent') || 
        event.eventType.includes('quote') ||
        event.eventType.includes('invoice')
      );

      const successfulEvents = paymentEvents.filter(event => 
        event.eventType.includes('succeeded') || 
        event.eventType.includes('completed')
      );

      const failedEvents = paymentEvents.filter(event => 
        event.eventType.includes('failed') || 
        event.eventType.includes('error')
      );

      // Calculate volume metrics
      let totalVolumeUsd = 0;
      let totalVolumeBtc = 0;
      let totalProcessingTime = 0;
      let processingTimeCount = 0;

      for (const event of successfulEvents) {
        try {
          const payload = JSON.parse(event.payload);
          
          if (payload.amount) {
            totalVolumeUsd += payload.amount / 100; // Convert from cents
          }
          
          if (payload.amountUsd) {
            totalVolumeUsd += payload.amountUsd;
          }
          
          if (payload.amountBtc) {
            totalVolumeBtc += payload.amountBtc;
          }

          // Calculate processing time
          if (event.processedAt) {
            const processingTime = new Date(event.processedAt).getTime() - new Date(event.createdAt).getTime();
            totalProcessingTime += processingTime;
            processingTimeCount++;
          }
        } catch (error) {
          console.error('Error parsing event payload:', error);
        }
      }

      const totalTransactions = paymentEvents.length;
      const successfulTransactions = successfulEvents.length;
      const failedTransactions = failedEvents.length;
      const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
      const averageTransactionSize = successfulTransactions > 0 ? totalVolumeUsd / successfulTransactions : 0;
      const averageProcessingTime = processingTimeCount > 0 ? totalProcessingTime / processingTimeCount : 0;

      this.metrics = {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        totalVolumeUsd: Math.round(totalVolumeUsd * 100) / 100,
        totalVolumeBtc: Math.round(totalVolumeBtc * 100000000) / 100000000,
        averageTransactionSize: Math.round(averageTransactionSize * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        averageProcessingTime: Math.round(averageProcessingTime),
      };

      this.lastMetricsUpdate = now;
      return this.metrics;
    } catch (error) {
      console.error('Error calculating payment metrics:', error);
      throw error;
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const uptime = Date.now() - this.startTime;
      const memoryUsage = process.memoryUsage();
      
      // Get webhook health
      const allEvents = await storage.getWebhookEvents(undefined, undefined);
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentEvents = allEvents.filter(event => 
        new Date(event.createdAt) > last24Hours
      );

      const processedEvents = recentEvents.filter(event => event.processed);
      const failedEvents = recentEvents.filter(event => event.error);
      
      let totalProcessingTime = 0;
      let processingTimeCount = 0;
      
      for (const event of processedEvents) {
        if (event.processedAt) {
          const processingTime = new Date(event.processedAt).getTime() - new Date(event.createdAt).getTime();
          totalProcessingTime += processingTime;
          processingTimeCount++;
        }
      }

      const averageProcessingTime = processingTimeCount > 0 ? totalProcessingTime / processingTimeCount : 0;

      // Determine overall health status
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (failedEvents.length > processedEvents.length * 0.1) { // More than 10% failure rate
        status = 'degraded';
      }
      
      if (failedEvents.length > processedEvents.length * 0.3) { // More than 30% failure rate
        status = 'unhealthy';
      }

      return {
        status,
        uptime,
        memoryUsage,
        activeConnections: 0, // TODO: Implement connection tracking
        queueStatus: {
          funding: { pending: 0, processing: 0, completed: 0, failed: 0 }, // TODO: Get from queue
          conversion: { pending: 0, processing: 0, completed: 0, failed: 0 },
          payout: { pending: 0, processing: 0, completed: 0, failed: 0 },
          webhook: { pending: 0, processing: 0, completed: 0, failed: 0 },
        },
        webhookHealth: {
          totalEvents: recentEvents.length,
          processedEvents: processedEvents.length,
          failedEvents: failedEvents.length,
          averageProcessingTime: Math.round(averageProcessingTime),
        },
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      throw error;
    }
  }

  /**
   * Get real-time alerts
   */
  async getAlerts(): Promise<Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>> {
    try {
      const alerts: Array<{
        id: string;
        type: 'error' | 'warning' | 'info';
        message: string;
        timestamp: Date;
        resolved: boolean;
      }> = [];

      // Check for high error rates
      const recentEvents = await storage.getWebhookEvents(undefined, undefined);
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = recentEvents.filter(event => 
        new Date(event.createdAt) > lastHour
      ).length;
      
      const failedCount = recentEvents.filter(event => 
        event.error && new Date(event.createdAt) > lastHour
      ).length;

      if (recentCount > 0) {
        const errorRate = (failedCount / recentCount) * 100;
        
        if (errorRate > 20) {
          alerts.push({
            id: `high_error_rate_${Date.now()}`,
            type: 'error',
            message: `High error rate detected: ${errorRate.toFixed(1)}% (${failedCount}/${recentCount} events failed)`,
            timestamp: new Date(),
            resolved: false,
          });
        } else if (errorRate > 10) {
          alerts.push({
            id: `elevated_error_rate_${Date.now()}`,
            type: 'warning',
            message: `Elevated error rate: ${errorRate.toFixed(1)}% (${failedCount}/${recentCount} events failed)`,
            timestamp: new Date(),
            resolved: false,
          });
        }
      }

      // Check for unprocessed events
      const unprocessedEvents = await storage.getWebhookEvents(undefined, false);
      const oldUnprocessed = unprocessedEvents.filter(event => 
        new Date(event.createdAt) < new Date(Date.now() - 10 * 60 * 1000) // 10 minutes old
      );

      if (oldUnprocessed.length > 5) {
        alerts.push({
          id: `unprocessed_events_${Date.now()}`,
          type: 'warning',
          message: `${oldUnprocessed.length} events have been unprocessed for more than 10 minutes`,
          timestamp: new Date(),
          resolved: false,
        });
      }

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
      
      if (memoryUsageMB > 500) { // More than 500MB
        alerts.push({
          id: `high_memory_usage_${Date.now()}`,
          type: 'warning',
          message: `High memory usage: ${memoryUsageMB.toFixed(1)}MB`,
          timestamp: new Date(),
          resolved: false,
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Log a custom event
   */
  async logEvent(
    eventType: string,
    data: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
  ): Promise<void> {
    await ErrorLogger.logPaymentEvent(eventType, data, severity);
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    requestsPerMinute: number;
    errorRate: number;
    uptime: number;
  }> {
    try {
      const uptime = Date.now() - this.startTime;
      
      // Get recent events for performance calculation
      const recentEvents = await storage.getWebhookEvents(undefined, undefined);
      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = recentEvents.filter(event => 
        new Date(event.createdAt) > lastHour
      ).length;
      
      const failedCount = recentEvents.filter(event => 
        event.error && new Date(event.createdAt) > lastHour
      ).length;

      return {
        averageResponseTime: 0, // TODO: Implement response time tracking
        requestsPerMinute: recentCount / 60,
        errorRate: recentCount > 0 ? (failedCount / recentCount) * 100 : 0,
        uptime: Math.round(uptime / 1000), // Convert to seconds
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }
}

export const paymentMonitor = PaymentMonitor.getInstance();
