import {
  ErrorHandler,
  AppError,
  ErrorSeverity,
  ErrorCategory,
} from './errorHandler';

// Logger configuration
export interface LoggerConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  logLevel: LogLevel;
  maxLocalLogs: number;
  remoteEndpoint?: string;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

export class Logger {
  private static config: LoggerConfig = {
    enableConsoleLogging: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production',
    enableRemoteLogging: process.env.EXPO_PUBLIC_ENVIRONMENT === 'production',
    logLevel:
      process.env.EXPO_PUBLIC_ENVIRONMENT === 'production'
        ? LogLevel.WARN
        : LogLevel.DEBUG,
    maxLocalLogs: 1000,
  };

  private static logs: LogEntry[] = [];
  private static sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  static configure(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
  }

  static debug(message: string, context?: string, data?: any) {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  static info(message: string, context?: string, data?: any) {
    this.log(LogLevel.INFO, message, context, data);
  }

  static warn(message: string, context?: string, data?: any) {
    this.log(LogLevel.WARN, message, context, data);
  }

  static error(message: string, context?: string, data?: any) {
    this.log(LogLevel.ERROR, message, context, data);
  }

  static fatal(message: string, context?: string, data?: any) {
    this.log(LogLevel.FATAL, message, context, data);
  }

  private static log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any
  ) {
    // Check if we should log this level
    if (level < this.config.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      sessionId: this.sessionId,
    };

    // Add to local storage
    this.addToLocalLogs(logEntry);

    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(logEntry);
    }

    // Remote logging for important messages
    if (this.config.enableRemoteLogging && level >= LogLevel.ERROR) {
      this.sendToRemote(logEntry);
    }
  }

  private static generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static addToLocalLogs(logEntry: LogEntry) {
    this.logs.push(logEntry);

    // Keep logs within limit
    if (this.logs.length > this.config.maxLocalLogs) {
      this.logs.shift();
    }
  }

  private static logToConsole(logEntry: LogEntry) {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const levelName = levelNames[logEntry.level];
    const contextStr = logEntry.context ? ` [${logEntry.context}]` : '';
    const message = `${logEntry.timestamp} ${levelName}${contextStr}: ${logEntry.message}`;

    switch (logEntry.level) {
      case LogLevel.DEBUG:
        console.debug(message, logEntry.data);
        break;
      case LogLevel.INFO:
        console.info(message, logEntry.data);
        break;
      case LogLevel.WARN:
        console.warn(message, logEntry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, logEntry.data);
        break;
    }
  }

  private static async sendToRemote(logEntry: LogEntry) {
    if (!this.config.remoteEndpoint) {
      return;
    }

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to send log to remote:', error);
    }
  }

  static getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level >= level);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return [...filteredLogs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static getLogStats() {
    const now = Date.now();
    const last24Hours = this.logs.filter(
      log => now - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    return {
      total: this.logs.length,
      last24Hours: last24Hours.length,
      byLevel: {
        debug: this.logs.filter(log => log.level === LogLevel.DEBUG).length,
        info: this.logs.filter(log => log.level === LogLevel.INFO).length,
        warn: this.logs.filter(log => log.level === LogLevel.WARN).length,
        error: this.logs.filter(log => log.level === LogLevel.ERROR).length,
        fatal: this.logs.filter(log => log.level === LogLevel.FATAL).length,
      },
    };
  }

  // Integration with ErrorHandler
  static logAppError(error: AppError, context?: string) {
    const level = this.mapErrorSeverityToLogLevel(error.severity);
    this.log(level, error.message, context || error.context, {
      code: error.code,
      category: error.category,
      details: error.details,
      retryable: error.retryable,
    });
  }

  private static mapErrorSeverityToLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return LogLevel.WARN;
      case ErrorSeverity.MEDIUM:
        return LogLevel.ERROR;
      case ErrorSeverity.HIGH:
        return LogLevel.ERROR;
      case ErrorSeverity.CRITICAL:
        return LogLevel.FATAL;
      default:
        return LogLevel.ERROR;
    }
  }

  // Performance logging
  static startTimer(name: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.info(`Timer: ${name} completed in ${duration}ms`, 'performance', {
        duration,
        name,
      });
    };
  }

  // User action logging
  static logUserAction(action: string, userId?: string, data?: any) {
    this.info(`User action: ${action}`, 'user-action', {
      action,
      userId,
      ...data,
    });
  }

  // API call logging
  static logApiCall(
    method: string,
    url: string,
    status?: number,
    duration?: number
  ) {
    const level = status && status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} ${url}`, 'api', {
      method,
      url,
      status,
      duration,
    });
  }
}

// Export singleton instance
export default Logger;
