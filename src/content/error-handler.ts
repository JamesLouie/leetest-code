/**
 * Error Handling and Logging System
 * Provides comprehensive error handling, logging, and recovery mechanisms
 */

import { ParsingError } from '../types/leetcode';
import type { ParsingErrorInfo } from '../types/leetcode';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: unknown;
  error?: Error;
}

export interface ErrorRecoveryStrategy {
  name: string;
  condition: (error: ParsingErrorInfo) => boolean;
  action: () => Promise<boolean>;
  maxAttempts: number;
}

export class ErrorHandler {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private debugMode = false;
  private recoveryStrategies: ErrorRecoveryStrategy[] = [];

  constructor(debugMode = false) {
    this.debugMode = debugMode;
    this.setupRecoveryStrategies();
  }

  /**
   * Log a message with context
   */
  log(level: LogEntry['level'], message: string, context?: unknown, error?: Error) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };

    this.logs.push(entry);
    
    // Keep logs within limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output based on level
    if (this.debugMode || level === 'error' || level === 'warn') {
      const prefix = `[Leetest] [${level.toUpperCase()}]`;
      if (error) {
        console.error(prefix, message, context, error);
      } else {
        console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](prefix, message, context);
      }
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: unknown) {
    this.log('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: unknown) {
    this.log('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: unknown, error?: Error) {
    this.log('error', message, context, error);
  }

  /**
   * Log debug message (only in debug mode)
   */
  debug(message: string, context?: unknown) {
    if (this.debugMode) {
      this.log('debug', message, context);
    }
  }

  /**
   * Create a parsing error info object
   */
  createParsingError(
    type: ParsingError,
    message: string,
    element?: string,
    context?: unknown
  ): ParsingErrorInfo {
    return {
      type,
      message,
      element,
      context
    };
  }

  /**
   * Handle parsing errors with recovery strategies
   */
  async handleParsingError(errorInfo: ParsingErrorInfo): Promise<boolean> {
    this.error(`Parsing error: ${errorInfo.message}`, {
      type: errorInfo.type,
      element: errorInfo.element,
      context: errorInfo.context
    });

    // Try recovery strategies
    for (const strategy of this.recoveryStrategies) {
      if (strategy.condition(errorInfo)) {
        this.info(`Attempting recovery strategy: ${strategy.name}`);
        
        for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
          try {
            const success = await strategy.action();
            if (success) {
              this.info(`Recovery strategy ${strategy.name} succeeded on attempt ${attempt}`);
              return true;
            }
          } catch (error) {
            this.warn(`Recovery strategy ${strategy.name} failed on attempt ${attempt}`, { error });
          }
        }
        
        this.error(`Recovery strategy ${strategy.name} failed after ${strategy.maxAttempts} attempts`);
      }
    }

    return false;
  }

  /**
   * Setup default recovery strategies
   */
  private setupRecoveryStrategies() {
    this.recoveryStrategies = [
      {
        name: 'Wait and Retry',
        condition: (error) => error.type === ParsingError.ELEMENT_NOT_FOUND,
        action: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return document.readyState === 'complete';
        },
        maxAttempts: 3
      },
      {
        name: 'DOM Refresh',
        condition: (error) => error.type === ParsingError.INVALID_DATA,
        action: async () => {
          // Force a DOM refresh by triggering a resize event
          window.dispatchEvent(new Event('resize'));
          await new Promise(resolve => setTimeout(resolve, 500));
          return true;
        },
        maxAttempts: 2
      },
      {
        name: 'Page Reload',
        condition: (error) => error.type === ParsingError.NETWORK_ERROR,
        action: async () => {
          // This would reload the page - use with caution
          // window.location.reload();
          return false; // Disabled for safety
        },
        maxAttempts: 1
      }
    ];
  }

  /**
   * Get recent logs
   */
  getRecentLogs(count = 10): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
  }

  /**
   * Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.logs.length,
      errors: this.logs.filter(log => log.level === 'error').length,
      warnings: this.logs.filter(log => log.level === 'warn').length,
      info: this.logs.filter(log => log.level === 'info').length,
      debug: this.logs.filter(log => log.level === 'debug').length
    };

    return stats;
  }

  /**
   * Check if there are recent errors
   */
  hasRecentErrors(minutes = 5): boolean {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.logs.some(log => 
      log.level === 'error' && 
      new Date(log.timestamp) > cutoff
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const errorLogs = this.logs.filter(log => log.level === 'error');
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
    );

    return {
      totalErrors: errorLogs.length,
      recentErrors: errorLogs.filter(log => 
        new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000)
      ).length,
      errorRate: recentLogs.length > 0 ? errorLogs.length / recentLogs.length : 0,
      averageLogsPerHour: recentLogs.length
    };
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler(false); 