import { NextRequest, NextResponse } from 'next/server';

/**
 * Comprehensive monitoring and logging utilities
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context: LogContext;
  metadata?: any;
}

export interface LogContext {
  requestId: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
}

export interface MetricsEntry {
  timestamp: string;
  metric: string;
  value: number;
  tags: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: MetricsEntry[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // minutes
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  averageResponseTime: number;
  requestCount: number;
  errorRate: number;
  successRate: number;
  lastUpdated: string;
}

/**
 * Logging levels
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

/**
 * Metric types
 */
export const METRIC_TYPES = {
  REQUEST_COUNT: 'request_count',
  RESPONSE_TIME: 'response_time',
  ERROR_COUNT: 'error_count',
  CREDIT_USAGE: 'credit_usage',
  PAYMENT_COUNT: 'payment_count',
  USER_ACTIVITY: 'user_activity',
  API_USAGE: 'api_usage'
} as const;

/**
 * In-memory storage for logs and metrics (in production, use external services)
 */
class MonitoringStorage {
  private logs: LogEntry[] = [];
  private metrics: MetricsEntry[] = [];
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private alertHistory: Map<string, number> = new Map();

  addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  addMetric(entry: MetricsEntry): void {
    this.metrics.push(entry);
    
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-10000);
    }
  }

  getLogs(filter?: Partial<LogEntry>): LogEntry[] {
    if (!filter) return this.logs;
    
    return this.logs.filter(log => {
      return Object.entries(filter).every(([key, value]) => {
        return log[key as keyof LogEntry] === value;
      });
    });
  }

  getMetrics(filter?: Partial<MetricsEntry>): MetricsEntry[] {
    if (!filter) return this.metrics;
    
    return this.metrics.filter(metric => {
      return Object.entries(filter).every(([key, value]) => {
        return metric[key as keyof MetricsEntry] === value;
      });
    });
  }

  updatePerformanceMetrics(endpoint: string, method: string, responseTime: number, isError: boolean): void {
    const key = `${method}:${endpoint}`;
    const existing = this.performanceMetrics.get(key);
    
    if (existing) {
      existing.requestCount++;
      existing.averageResponseTime = (existing.averageResponseTime + responseTime) / 2;
      existing.errorRate = isError ? existing.errorRate + 1 : existing.errorRate;
      existing.successRate = existing.requestCount - existing.errorRate;
      existing.lastUpdated = new Date().toISOString();
    } else {
      this.performanceMetrics.set(key, {
        endpoint,
        method,
        averageResponseTime: responseTime,
        requestCount: 1,
        errorRate: isError ? 1 : 0,
        successRate: isError ? 0 : 1,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  getPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values());
  }

  getAlertHistory(alertId: string): number {
    return this.alertHistory.get(alertId) || 0;
  }

  setAlertHistory(alertId: string, timestamp: number): void {
    this.alertHistory.set(alertId, timestamp);
  }
}

const storage = new MonitoringStorage();

/**
 * Logger class
 */
export class Logger {
  private context: Partial<LogContext>;

  constructor(context: Partial<LogContext> = {}) {
    this.context = context;
  }

  private log(level: string, message: string, metadata?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level as any,
      message,
      context: this.context as LogContext,
      metadata
    };

    storage.addLog(entry);
    
    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, metadata || '');
    }
  }

  info(message: string, metadata?: any): void {
    this.log(LOG_LEVELS.INFO, message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.log(LOG_LEVELS.WARN, message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.log(LOG_LEVELS.ERROR, message, metadata);
  }

  debug(message: string, metadata?: any): void {
    this.log(LOG_LEVELS.DEBUG, message, metadata);
  }
}

/**
 * Metrics collector
 */
export class MetricsCollector {
  private context: Record<string, string>;

  constructor(context: Record<string, string> = {}) {
    this.context = context;
  }

  private record(metric: string, value: number, tags: Record<string, string> = {}): void {
    const entry: MetricsEntry = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      tags: { ...this.context, ...tags }
    };

    storage.addMetric(entry);
  }

  incrementCounter(metric: string, tags: Record<string, string> = {}): void {
    this.record(metric, 1, tags);
  }

  recordGauge(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.record(metric, value, tags);
  }

  recordHistogram(metric: string, value: number, tags: Record<string, string> = {}): void {
    this.record(metric, value, tags);
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private startTime: number;
  private requestId: string;
  private endpoint: string;
  private method: string;

  constructor(requestId: string, endpoint: string, method: string) {
    this.startTime = Date.now();
    this.requestId = requestId;
    this.endpoint = endpoint;
    this.method = method;
  }

  end(isError: boolean = false): number {
    const duration = Date.now() - this.startTime;
    
    // Update performance metrics
    storage.updatePerformanceMetrics(this.endpoint, this.method, duration, isError);
    
    // Record metrics
    const metrics = new MetricsCollector({
      request_id: this.requestId,
      endpoint: this.endpoint,
      method: this.method
    });
    
    metrics.recordHistogram(METRIC_TYPES.RESPONSE_TIME, duration);
    metrics.incrementCounter(METRIC_TYPES.REQUEST_COUNT);
    
    if (isError) {
      metrics.incrementCounter(METRIC_TYPES.ERROR_COUNT);
    }
    
    return duration;
  }
}

/**
 * Alert manager
 */
export class AlertManager {
  private rules: AlertRule[] = [];

  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  checkAlerts(): void {
    const metrics = storage.getMetrics();
    
    for (const rule of this.rules) {
      const lastAlert = storage.getAlertHistory(rule.id);
      const now = Date.now();
      
      // Check cooldown
      if (now - lastAlert < rule.cooldown * 60 * 1000) {
        continue;
      }
      
      // Check condition
      if (rule.condition(metrics)) {
        this.triggerAlert(rule);
        storage.setAlertHistory(rule.id, now);
      }
    }
  }

  private triggerAlert(rule: AlertRule): void {
    const logger = new Logger();
    
    logger.error(`ALERT: ${rule.name}`, {
      severity: rule.severity,
      message: rule.message,
      ruleId: rule.id
    });
    
    // In production, send to external alerting service
    console.error(`🚨 ALERT [${rule.severity.toUpperCase()}]: ${rule.name} - ${rule.message}`);
  }
}

/**
 * Request monitoring middleware
 */
export function createRequestMonitor(request: NextRequest): {
  logger: Logger;
  metrics: MetricsCollector;
  performance: PerformanceMonitor;
} {
  const requestId = generateRequestId();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  const context: LogContext = {
    requestId,
    endpoint,
    method,
    ip,
    userAgent
  };
  
  const logger = new Logger(context);
  const metrics = new MetricsCollector({
    request_id: requestId,
    endpoint,
    method,
    ip
  });
  const performance = new PerformanceMonitor(requestId, endpoint, method);
  
  return { logger, metrics, performance };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Health check endpoint data
 */
export function getHealthCheckData(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  metrics: {
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
  dependencies: {
    database: 'healthy' | 'degraded' | 'unhealthy';
    externalAPIs: 'healthy' | 'degraded' | 'unhealthy';
  };
} {
  const performanceMetrics = storage.getPerformanceMetrics();
  const totalRequests = performanceMetrics.reduce((sum, metric) => sum + metric.requestCount, 0);
  const totalErrors = performanceMetrics.reduce((sum, metric) => sum + metric.errorRate, 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
  const averageResponseTime = performanceMetrics.length > 0 
    ? performanceMetrics.reduce((sum, metric) => sum + metric.averageResponseTime, 0) / performanceMetrics.length
    : 0;
  
  return {
    status: errorRate > 10 ? 'degraded' : 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    metrics: {
      totalRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100
    },
    dependencies: {
      database: 'healthy', // You would check actual database health
      externalAPIs: 'healthy' // You would check external API health
    }
  };
}

/**
 * Get monitoring dashboard data
 */
export function getMonitoringDashboard(): {
  logs: LogEntry[];
  metrics: MetricsEntry[];
  performance: PerformanceMetrics[];
  alerts: any[];
} {
  return {
    logs: storage.getLogs().slice(-100), // Last 100 logs
    metrics: storage.getMetrics().slice(-1000), // Last 1000 metrics
    performance: storage.getPerformanceMetrics(),
    alerts: [] // You would implement alert history
  };
}

/**
 * Initialize default alert rules
 */
export function initializeDefaultAlerts(): AlertManager {
  const alertManager = new AlertManager();
  
  // High error rate alert
  alertManager.addRule({
    id: 'high_error_rate',
    name: 'High Error Rate',
    condition: (metrics) => {
      const errorMetrics = metrics.filter(m => m.metric === METRIC_TYPES.ERROR_COUNT);
      const recentErrors = errorMetrics.filter(m => 
        Date.now() - new Date(m.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
      );
      return recentErrors.length > 10;
    },
    severity: 'high',
    message: 'Error rate is unusually high',
    cooldown: 15 // 15 minutes
  });
  
  // Slow response time alert
  alertManager.addRule({
    id: 'slow_response_time',
    name: 'Slow Response Time',
    condition: (metrics) => {
      const responseTimeMetrics = metrics.filter(m => m.metric === METRIC_TYPES.RESPONSE_TIME);
      const recentSlow = responseTimeMetrics.filter(m => 
        Date.now() - new Date(m.timestamp).getTime() < 5 * 60 * 1000 && m.value > 5000 // 5 seconds
      );
      return recentSlow.length > 5;
    },
    severity: 'medium',
    message: 'Response times are unusually slow',
    cooldown: 10 // 10 minutes
  });
  
  // High credit usage alert
  alertManager.addRule({
    id: 'high_credit_usage',
    name: 'High Credit Usage',
    condition: (metrics) => {
      const creditMetrics = metrics.filter(m => m.metric === METRIC_TYPES.CREDIT_USAGE);
      const recentUsage = creditMetrics.filter(m => 
        Date.now() - new Date(m.timestamp).getTime() < 60 * 60 * 1000 // Last hour
      );
      const totalUsage = recentUsage.reduce((sum, m) => sum + m.value, 0);
      return totalUsage > 1000;
    },
    severity: 'medium',
    message: 'Credit usage is unusually high',
    cooldown: 30 // 30 minutes
  });
  
  return alertManager;
}

/**
 * Export monitoring utilities
 */
export const monitoring = {
  Logger,
  MetricsCollector,
  PerformanceMonitor,
  AlertManager,
  createRequestMonitor,
  getHealthCheckData,
  getMonitoringDashboard,
  initializeDefaultAlerts,
  storage
};
