import { Alert } from 'react-native';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  AUTH = 'auth',
  NETWORK = 'network',
  DATABASE = 'database',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown',
}

export interface AppError {
  code: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: string;
  context?: string;
  details?: any;
  userMessage?: string;
  retryable?: boolean;
}

export interface ErrorLogEntry {
  id: string;
  error: AppError;
  userId?: string;
  sessionId?: string;
  deviceInfo?: {
    platform: string;
    version: string;
    model?: string;
  };
  stackTrace?: string;
}

export class ErrorHandler {
  private static errorQueue: ErrorLogEntry[] = [];
  private static maxQueueSize = 100;
  private static isProduction =
    process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';

  static handleSupabaseError(error: any): AppError {
    const timestamp = new Date().toISOString();

    if (!this.isProduction) {
      console.error('Supabase error:', error);
    }

    // Handle specific Supabase error codes
    switch (error.code) {
      case '42P17':
        return {
          code: 'RLS_RECURSION',
          message:
            'Error de configuración de seguridad. Contacta al administrador.',
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.CRITICAL,
          timestamp,
          details: error,
          userMessage: 'Error interno del sistema. Por favor contacta soporte.',
          retryable: false,
        };

      case 'PGRST116':
        return {
          code: 'NOT_FOUND',
          message: 'Recurso no encontrado',
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.LOW,
          timestamp,
          details: error,
          userMessage: 'El recurso solicitado no existe.',
          retryable: false,
        };

      case '23505':
        return {
          code: 'DUPLICATE_KEY',
          message: 'Ya existe un registro con esos datos',
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          details: error,
          userMessage: 'Ya existe un registro con esos datos.',
          retryable: false,
        };

      case '23503':
        return {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Error de referencia de datos',
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.HIGH,
          timestamp,
          details: error,
          userMessage: 'Error en la integridad de los datos.',
          retryable: false,
        };

      default:
        return {
          code: error.code || 'UNKNOWN_DATABASE_ERROR',
          message: error.message || 'Error desconocido en la base de datos',
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          details: error,
          userMessage: 'Error en la base de datos. Intenta de nuevo.',
          retryable: true,
        };
    }
  }

  static handleAuthError(error: any): AppError {
    const timestamp = new Date().toISOString();

    if (!this.isProduction) {
      console.error('Auth error:', error);
    }

    const errorMessage = error.message || '';
    const errorCode = error.code || '';

    // Handle Supabase auth error codes
    if (
      errorCode === 'invalid_credentials' ||
      errorMessage.includes('Invalid login credentials')
    ) {
      return {
        code: 'INVALID_CREDENTIALS',
        message: 'Credenciales incorrectas. Verifica tu email y contraseña.',
        category: ErrorCategory.AUTH,
        severity: ErrorSeverity.LOW,
        timestamp,
        details: error,
        userMessage: 'Email o contraseña incorrectos.',
        retryable: true,
      };
    }

    switch (errorMessage) {
      case 'Invalid login credentials':
        return {
          code: 'INVALID_CREDENTIALS',
          message: 'Credenciales incorrectas. Verifica tu email y contraseña.',
          category: ErrorCategory.AUTH,
          severity: ErrorSeverity.LOW,
          timestamp,
          details: error,
          userMessage: 'Email o contraseña incorrectos.',
          retryable: true,
        };

      case 'Email not confirmed':
        return {
          code: 'EMAIL_NOT_CONFIRMED',
          message: 'Por favor confirma tu email antes de iniciar sesión.',
          category: ErrorCategory.AUTH,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          details: error,
          userMessage: 'Debes confirmar tu email antes de continuar.',
          retryable: false,
        };

      case 'User already registered':
        return {
          code: 'USER_EXISTS',
          message: 'Ya existe una cuenta con este email.',
          category: ErrorCategory.AUTH,
          severity: ErrorSeverity.LOW,
          timestamp,
          details: error,
          userMessage: 'Ya tienes una cuenta con este email.',
          retryable: false,
        };

      default:
        return {
          code: 'AUTH_ERROR',
          message: errorMessage || 'Error de autenticación',
          category: ErrorCategory.AUTH,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          details: error,
          userMessage: 'Error de autenticación. Intenta de nuevo.',
          retryable: true,
        };
    }
  }

  static handleNetworkError(error: any): AppError {
    const timestamp = new Date().toISOString();

    if (!this.isProduction) {
      console.error('Network error:', error);
    }

    if (!navigator.onLine) {
      return {
        code: 'NO_INTERNET',
        message: 'Sin conexión a internet. Verifica tu conexión.',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        timestamp,
        details: error,
        userMessage: 'No hay conexión a internet.',
        retryable: true,
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: 'Error de conexión. Intenta de nuevo.',
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.MEDIUM,
      timestamp,
      details: error,
      userMessage: 'Error de conexión. Verifica tu internet.',
      retryable: true,
    };
  }

  static showUserFriendlyError(error: AppError, showRetryOption = false) {
    const message = error.userMessage || error.message;
    const buttons = [{ text: 'OK', style: 'default' as const }];

    if (showRetryOption && error.retryable) {
      buttons.unshift({ text: 'Reintentar', style: 'default' as const });
    }

    Alert.alert('Error', message, buttons);
  }

  static async logError(error: AppError, context?: string, userId?: string) {
    const logEntry: ErrorLogEntry = {
      id: this.generateErrorId(),
      error: {
        ...error,
        context: context || error.context || 'unknown',
      },
      userId,
      sessionId: this.getSessionId(),
      deviceInfo: this.getDeviceInfo(),
      stackTrace: new Error().stack,
    };

    // Add to local queue
    this.addToErrorQueue(logEntry);

    // Log to console in development
    if (!this.isProduction) {
      console.error('App Error:', logEntry);
    }

    // Send to error tracking service in production
    if (this.isProduction && error.severity !== ErrorSeverity.LOW) {
      await this.sendToErrorService(logEntry);
    }
  }

  private static generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getSessionId(): string {
    // In a real app, this would be generated at app start
    return 'session_' + Date.now();
  }

  private static getDeviceInfo() {
    return {
      platform: 'mobile', // You can use react-native-device-info for real device info
      version: '1.0.0',
    };
  }

  private static addToErrorQueue(logEntry: ErrorLogEntry) {
    this.errorQueue.push(logEntry);

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  private static async sendToErrorService(logEntry: ErrorLogEntry) {
    try {
      // In production, send to your error tracking service
      // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(logEntry) });
      console.log('Would send to error service:', logEntry.id);
    } catch (error) {
      console.error('Failed to send error to service:', error);
    }
  }

  static getErrorQueue(): ErrorLogEntry[] {
    return [...this.errorQueue];
  }

  static clearErrorQueue() {
    this.errorQueue = [];
  }

  static getErrorStats() {
    const now = Date.now();
    const last24Hours = this.errorQueue.filter(
      entry =>
        now - new Date(entry.error.timestamp).getTime() < 24 * 60 * 60 * 1000
    );

    return {
      total: this.errorQueue.length,
      last24Hours: last24Hours.length,
      bySeverity: {
        critical: this.errorQueue.filter(
          e => e.error.severity === ErrorSeverity.CRITICAL
        ).length,
        high: this.errorQueue.filter(
          e => e.error.severity === ErrorSeverity.HIGH
        ).length,
        medium: this.errorQueue.filter(
          e => e.error.severity === ErrorSeverity.MEDIUM
        ).length,
        low: this.errorQueue.filter(e => e.error.severity === ErrorSeverity.LOW)
          .length,
      },
      byCategory: {
        auth: this.errorQueue.filter(
          e => e.error.category === ErrorCategory.AUTH
        ).length,
        network: this.errorQueue.filter(
          e => e.error.category === ErrorCategory.NETWORK
        ).length,
        database: this.errorQueue.filter(
          e => e.error.category === ErrorCategory.DATABASE
        ).length,
        validation: this.errorQueue.filter(
          e => e.error.category === ErrorCategory.VALIDATION
        ).length,
        permission: this.errorQueue.filter(
          e => e.error.category === ErrorCategory.PERMISSION
        ).length,
        unknown: this.errorQueue.filter(
          e => e.error.category === ErrorCategory.UNKNOWN
        ).length,
      },
    };
  }
}

export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string,
  options?: {
    showUserError?: boolean;
    showRetryOption?: boolean;
    userId?: string;
    fallbackValue?: R;
  }
) => {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error: any) {
      let appError: AppError;

      // Determine error type and handle accordingly
      if (
        error.code &&
        (error.code.startsWith('PGRST') || error.code.match(/^\d+$/))
      ) {
        appError = ErrorHandler.handleSupabaseError(error);
      } else if (
        error.message?.toLowerCase().includes('auth') ||
        error.code === 'invalid_credentials'
      ) {
        appError = ErrorHandler.handleAuthError(error);
      } else if (
        error.message?.toLowerCase().includes('network') ||
        error.name === 'NetworkError'
      ) {
        appError = ErrorHandler.handleNetworkError(error);
      } else {
        // Handle unknown errors
        const timestamp = new Date().toISOString();
        appError = {
          code: 'UNKNOWN_ERROR',
          message: error.message || 'Error desconocido',
          category: ErrorCategory.UNKNOWN,
          severity: ErrorSeverity.MEDIUM,
          timestamp,
          context,
          details: error,
          userMessage: 'Ha ocurrido un error inesperado.',
          retryable: true,
        };
      }

      // Log the error
      await ErrorHandler.logError(appError, context, options?.userId);

      // Show user-friendly error if requested
      if (options?.showUserError !== false) {
        ErrorHandler.showUserFriendlyError(appError, options?.showRetryOption);
      }

      return options?.fallbackValue ?? null;
    }
  };
};

// Utility function for creating validation errors
export const createValidationError = (
  message: string,
  field?: string
): AppError => {
  return {
    code: 'VALIDATION_ERROR',
    message,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    timestamp: new Date().toISOString(),
    context: field ? `field:${field}` : 'validation',
    userMessage: message,
    retryable: false,
  };
};

// Utility function for creating permission errors
export const createPermissionError = (action: string): AppError => {
  return {
    code: 'PERMISSION_DENIED',
    message: `No tienes permisos para ${action}`,
    category: ErrorCategory.PERMISSION,
    severity: ErrorSeverity.HIGH,
    timestamp: new Date().toISOString(),
    context: `action:${action}`,
    userMessage: 'No tienes permisos para realizar esta acción.',
    retryable: false,
  };
};

// Hook for React components to handle errors
export const useErrorHandler = () => {
  const handleError = async (
    error: any,
    context?: string,
    showUserError = true
  ) => {
    const wrappedFn = withErrorHandling(
      async () => {
        throw error;
      },
      context,
      { showUserError }
    );
    await wrappedFn();
  };

  return { handleError, ErrorHandler };
};
