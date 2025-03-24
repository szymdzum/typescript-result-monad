/**
 * Base custom error class for the Result package
 */
export class ResultError extends Error {
  // Use declare for cause property since it's part of the Error prototype in newer JS
  public override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'ResultError';
    this.cause = cause;

    // Preserve the original error's stack trace if available
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }

    Object.setPrototypeOf(this, ResultError.prototype);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends ResultError {
  constructor(message: string, cause?: Error) {
    super(`Validation Error: ${message}`, cause);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error for not found resources
 */
export class NotFoundError extends ResultError {
  constructor(resource: string, id?: string, cause?: Error) {
    const idMessage = id ? ` with id '${id}'` : '';
    super(`Not Found: ${resource}${idMessage} could not be found`, cause);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error for unauthorized operations
 */
export class UnauthorizedError extends ResultError {
  constructor(message = 'You are not authorized to perform this operation', cause?: Error) {
    super(`Unauthorized: ${message}`, cause);
    this.name = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * Error for business rule violations
 */
export class BusinessRuleError extends ResultError {
  constructor(message: string, cause?: Error) {
    super(`Business Rule Violation: ${message}`, cause);
    this.name = 'BusinessRuleError';
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}

/**
 * Error for technical/infrastructure issues
 */
export class TechnicalError extends ResultError {
  constructor(message: string, cause?: Error) {
    super(`Technical Error: ${message}`, cause);
    this.name = 'TechnicalError';
    Object.setPrototypeOf(this, TechnicalError.prototype);
  }
}

/**
 * Error for timeouts
 */
export class TimeoutError extends TechnicalError {
  constructor(operation: string, timeoutMs: number, cause?: Error) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, cause);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error for concurrent modification
 */
export class ConcurrencyError extends ResultError {
  constructor(resource: string, id?: string, cause?: Error) {
    const idMessage = id ? ` with id '${id}'` : '';
    super(`Concurrency Error: ${resource}${idMessage} was modified by another process`, cause);
    this.name = 'ConcurrencyError';
    Object.setPrototypeOf(this, ConcurrencyError.prototype);
  }
}

/**
 * Error for cancelled operations
 */
export class CancellationError extends TechnicalError {
  /**
   * Request ID or other identifier for the cancelled operation
   */
  public readonly operationId?: string;

  constructor(message = 'Operation was cancelled', operationId?: string, cause?: Error) {
    super(`Cancellation: ${message}`, cause);
    this.name = 'CancellationError';
    this.operationId = operationId;

    // Override the message property to remove the "Technical Error:" prefix
    Object.defineProperty(this, 'message', {
      configurable: true,
      enumerable: false,
      value: `Cancellation: ${message}`,
      writable: true,
    });

    Object.setPrototypeOf(this, CancellationError.prototype);
  }
}
