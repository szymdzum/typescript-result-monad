import {
  ResultError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
  TechnicalError,
  TimeoutError,
  ConcurrencyError
} from '../src/errors';

describe('ResultError', () => {
  test('should create a basic error with message', () => {
    const error = new ResultError('Test error message');
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ResultError);
    expect(error.message).toBe('Test error message');
    expect(error.name).toBe('ResultError');
    expect(error.cause).toBeUndefined();
  });

  test('should create an error with cause', () => {
    const cause = new Error('Original error');
    const error = new ResultError('Test error message', cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Test error message');
  });

  test('should preserve stack trace from cause', () => {
    const cause = new Error('Original error');
    const error = new ResultError('Test error message', cause);
    
    expect(error.stack).toContain('Test error message');
    expect(error.stack).toContain('Caused by:');
    expect(error.stack).toContain('Original error');
  });

  test('should properly chain multiple causes', () => {
    const rootCause = new Error('Root cause');
    const intermediateCause = new ResultError('Intermediate error', rootCause);
    const finalError = new ResultError('Final error', intermediateCause);
    
    expect(finalError.cause).toBe(intermediateCause);
    expect(finalError.cause?.cause).toBe(rootCause);
    expect(finalError.stack).toContain('Root cause');
    expect(finalError.stack).toContain('Intermediate error');
    expect(finalError.stack).toContain('Final error');
  });
});

describe('ValidationError', () => {
  test('should create a ValidationError with correct message format', () => {
    const error = new ValidationError('Invalid input');
    
    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(ResultError);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Validation Error: Invalid input');
    expect(error.name).toBe('ValidationError');
  });

  test('should create a ValidationError with cause', () => {
    const cause = new Error('Original validation issue');
    const error = new ValidationError('Invalid input', cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Validation Error: Invalid input');
    expect(error.stack).toContain('Original validation issue');
  });
});

describe('NotFoundError', () => {
  test('should create a NotFoundError with resource only', () => {
    const error = new NotFoundError('User');
    
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(ResultError);
    expect(error.message).toBe('Not Found: User could not be found');
    expect(error.name).toBe('NotFoundError');
  });

  test('should create a NotFoundError with resource and ID', () => {
    const error = new NotFoundError('User', '123');
    
    expect(error.message).toBe("Not Found: User with id '123' could not be found");
  });

  test('should create a NotFoundError with cause', () => {
    const cause = new Error('Database error');
    const error = new NotFoundError('User', '123', cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("Not Found: User with id '123' could not be found");
    expect(error.stack).toContain('Database error');
  });
});

describe('UnauthorizedError', () => {
  test('should create an UnauthorizedError with default message', () => {
    const error = new UnauthorizedError();
    
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error).toBeInstanceOf(ResultError);
    expect(error.message).toBe('Unauthorized: You are not authorized to perform this operation');
    expect(error.name).toBe('UnauthorizedError');
  });

  test('should create an UnauthorizedError with custom message', () => {
    const error = new UnauthorizedError('Missing permission: ADMIN');
    
    expect(error.message).toBe('Unauthorized: Missing permission: ADMIN');
  });

  test('should create an UnauthorizedError with cause', () => {
    const cause = new Error('Token expired');
    const error = new UnauthorizedError('Invalid token', cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Unauthorized: Invalid token');
    expect(error.stack).toContain('Token expired');
  });
});

describe('BusinessRuleError', () => {
  test('should create a BusinessRuleError with correct message format', () => {
    const error = new BusinessRuleError('Insufficient balance for withdrawal');
    
    expect(error).toBeInstanceOf(BusinessRuleError);
    expect(error).toBeInstanceOf(ResultError);
    expect(error.message).toBe('Business Rule Violation: Insufficient balance for withdrawal');
    expect(error.name).toBe('BusinessRuleError');
  });

  test('should create a BusinessRuleError with cause', () => {
    const cause = new ValidationError('Amount must be positive');
    const error = new BusinessRuleError('Invalid transaction', cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Business Rule Violation: Invalid transaction');
    expect(error.cause?.message).toBe('Validation Error: Amount must be positive');
  });
});

describe('TechnicalError', () => {
  test('should create a TechnicalError with correct message format', () => {
    const error = new TechnicalError('Database connection failed');
    
    expect(error).toBeInstanceOf(TechnicalError);
    expect(error).toBeInstanceOf(ResultError);
    expect(error.message).toBe('Technical Error: Database connection failed');
    expect(error.name).toBe('TechnicalError');
  });

  test('should create a TechnicalError with cause', () => {
    const cause = new Error('Connection refused');
    const error = new TechnicalError('Database connection failed', cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe('Technical Error: Database connection failed');
    expect(error.stack).toContain('Connection refused');
  });
});

describe('TimeoutError', () => {
  test('should create a TimeoutError with correct message format', () => {
    const error = new TimeoutError('fetchData', 5000);
    
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error).toBeInstanceOf(TechnicalError);
    expect(error).toBeInstanceOf(ResultError);
    expect(error.message).toBe("Technical Error: Operation 'fetchData' timed out after 5000ms");
    expect(error.name).toBe('TimeoutError');
  });

  test('should create a TimeoutError with cause', () => {
    const cause = new Error('Network is unstable');
    const error = new TimeoutError('processPayment', 10000, cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("Technical Error: Operation 'processPayment' timed out after 10000ms");
    expect(error.stack).toContain('Network is unstable');
  });
});

describe('ConcurrencyError', () => {
  test('should create a ConcurrencyError with resource only', () => {
    const error = new ConcurrencyError('Order');
    
    expect(error).toBeInstanceOf(ConcurrencyError);
    expect(error).toBeInstanceOf(ResultError);
    expect(error.message).toBe('Concurrency Error: Order was modified by another process');
    expect(error.name).toBe('ConcurrencyError');
  });

  test('should create a ConcurrencyError with resource and ID', () => {
    const error = new ConcurrencyError('Order', '12345');
    
    expect(error.message).toBe("Concurrency Error: Order with id '12345' was modified by another process");
  });

  test('should create a ConcurrencyError with cause', () => {
    const cause = new Error('Database version conflict');
    const error = new ConcurrencyError('Order', '12345', cause);
    
    expect(error.cause).toBe(cause);
    expect(error.message).toBe("Concurrency Error: Order with id '12345' was modified by another process");
    expect(error.stack).toContain('Database version conflict');
  });
});

describe('Error inheritance', () => {
  test('should correctly identify error types in inheritance chain', () => {
    const resultError = new ResultError('Base error');
    const validationError = new ValidationError('Invalid data');
    const technicalError = new TechnicalError('System error');
    const timeoutError = new TimeoutError('slow operation', 1000);
    
    // ResultError checks
    expect(resultError instanceof ResultError).toBe(true);
    expect(resultError instanceof Error).toBe(true);
    expect(resultError instanceof ValidationError).toBe(false);
    
    // ValidationError checks
    expect(validationError instanceof ValidationError).toBe(true);
    expect(validationError instanceof ResultError).toBe(true);
    expect(validationError instanceof Error).toBe(true);
    expect(validationError instanceof NotFoundError).toBe(false);
    
    // Technical and Timeout errors
    expect(technicalError instanceof TechnicalError).toBe(true);
    expect(technicalError instanceof ResultError).toBe(true);
    expect(timeoutError instanceof TimeoutError).toBe(true);
    expect(timeoutError instanceof TechnicalError).toBe(true);
    expect(timeoutError instanceof ResultError).toBe(true);
    expect(technicalError instanceof TimeoutError).toBe(false);
  });
});

describe('Error cause chaining', () => {
  test('should maintain full error chain with mixed error types', () => {
    // Create a chain of errors
    const rootCause = new Error('Network error: connection refused');
    const dbError = new TechnicalError('Database connection failed', rootCause);
    const notFoundError = new NotFoundError('User', '123', dbError);
    const businessError = new BusinessRuleError('Cannot process user request', notFoundError);
    
    // Check the chain is properly maintained
    expect(businessError.cause).toBe(notFoundError);
    expect(businessError.cause?.cause).toBe(dbError);
    expect(businessError.cause?.cause?.cause).toBe(rootCause);
    
    // Check instanceof relationships
    expect(businessError.cause instanceof NotFoundError).toBe(true);
    expect(businessError.cause?.cause instanceof TechnicalError).toBe(true);
    expect(businessError.cause?.cause?.cause instanceof Error).toBe(true);
    
    // Check error messages through the chain
    expect(businessError.message).toBe('Business Rule Violation: Cannot process user request');
    expect(businessError.cause?.message).toBe("Not Found: User with id '123' could not be found");
    expect(businessError.cause?.cause?.message).toBe('Technical Error: Database connection failed');
    expect(businessError.cause?.cause?.cause?.message).toBe('Network error: connection refused');
    
    // Stack trace should contain all errors
    expect(businessError.stack).toContain('Cannot process user request');
    expect(businessError.stack).toContain("User with id '123' could not be found");
    expect(businessError.stack).toContain('Database connection failed');
    expect(businessError.stack).toContain('Network error: connection refused');
  });
});

