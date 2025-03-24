import {
  BusinessRuleError,
  ConcurrencyError,
  NotFoundError,
  Result,
  TechnicalError,
  TimeoutError,
  UnauthorizedError,
  ValidationError,
} from '../src';

/**
 * This file demonstrates advanced error handling patterns using
 * domain-specific error types provided by the Result monad.
 */

// Example 1: User validation with specific error types
interface User {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

function validateUser(user: User): Result<User, Error> {
  // Validation errors for invalid input
  if (!user.name || user.name.trim() === '') {
    return Result.fail(new ValidationError('User name is required'));
  }

  if (!user.email || !user.email.includes('@')) {
    return Result.fail(new ValidationError('Valid email is required'));
  }

  // NotFound errors for missing resources
  if (!user.id) {
    return Result.fail(new NotFoundError('User', user.email));
  }

  // Authorization errors for permission issues
  if (user.role !== 'admin' && user.role !== 'editor') {
    return Result.fail(new UnauthorizedError('User must have admin or editor role'));
  }

  return Result.ok(user);
}

// Example 2: Payment processing with business rule validations
interface Payment {
  amount: number;
  currency: string;
  paymentMethod?: string;
  accountBalance?: number;
}

function processPayment(payment: Payment): Result<string, Error> {
  // Business rule validations
  if (payment.amount <= 0) {
    return Result.fail(new BusinessRuleError('Payment amount must be positive'));
  }

  if (payment.currency !== 'USD' && payment.currency !== 'EUR') {
    return Result.fail(new BusinessRuleError('Only USD and EUR currencies are supported'));
  }

  if (!payment.paymentMethod) {
    return Result.fail(new ValidationError('Payment method is required'));
  }

  if (payment.accountBalance !== undefined && payment.amount > payment.accountBalance) {
    return Result.fail(new BusinessRuleError('Insufficient balance'));
  }

  // Simulate successful payment
  const transactionId = 'TRX-' + Math.random().toString(36).substring(2, 15);
  return Result.ok(transactionId);
}

// Example 3: Database operations with technical and concurrency errors
interface Document {
  id: string;
  version: number;
  data: any;
}

function saveDocument(doc: Document): Result<Document, Error> {
  // Simulate database connection issues
  if (Math.random() < 0.1) {
    return Result.fail(new TechnicalError('Database connection failed'));
  }

  // Simulate timeout issues
  if (Math.random() < 0.1) {
    return Result.fail(new TimeoutError('saveDocument', 5000));
  }

  // Simulate concurrency issues (version conflicts)
  if (Math.random() < 0.1) {
    return Result.fail(new ConcurrencyError('Document', doc.id));
  }

  // Simulated successful save with updated version
  return Result.ok({
    ...doc,
    version: doc.version + 1,
  });
}

// Example 4: Error chain and propagation
function performComplexOperation(userId: string): Result<any, Error> {
  // First operation: find user
  const userResult = findUser(userId);

  if (userResult.isFailure) {
    // Error is propagated automatically
    return userResult;
  }

  // Second operation: validate user with flatMap
  return userResult
    .flatMap(user => validateUser(user))
    .flatMap(validatedUser => {
      // Third operation: process payment if user is valid
      const payment: Payment = {
        amount: 100,
        currency: 'USD',
        paymentMethod: 'credit_card',
        accountBalance: 150,
      };

      return processPayment(payment);
    })
    .map(transactionId => {
      // Transform successful result
      return {
        success: true,
        transactionId,
        timestamp: new Date().toISOString(),
      };
    })
    .mapError(error => {
      // Add context to the error for better debugging
      if (error instanceof ValidationError) {
        return new ValidationError(`Invalid data in complex operation: ${error.message}`, error);
      }

      return new BusinessRuleError(`Complex operation failed: ${error.message}`, error);
    });
}

// Helper function for the example
function findUser(userId: string): Result<User, Error> {
  // Simulate user lookup
  if (userId === '123') {
    return Result.ok({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
    });
  }

  return Result.fail(new NotFoundError('User', userId));
}

// Example 5: Centralized error handling
function handleOperationResult<T>(result: Result<T, Error>): void {
  if (result.isSuccess) {
    console.log('Operation succeeded:', result.value);
    return;
  }

  // Centralized error handling based on error type
  const error = result.error;

  if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
    // Display validation errors to the user
  } else if (error instanceof NotFoundError) {
    console.error('Not found:', error.message);
    // Show 404 page or error message
  } else if (error instanceof UnauthorizedError) {
    console.error('Authorization error:', error.message);
    // Redirect to login page or show permission error
  } else if (error instanceof BusinessRuleError) {
    console.error('Business rule violation:', error.message);
    // Show friendly error message explaining the business rule
  } else if (error instanceof TimeoutError) {
    console.error('Operation timed out:', error.message);
    // Suggest retry or show maintenance message
  } else if (error instanceof ConcurrencyError) {
    console.error('Concurrency error:', error.message);
    // Suggest refreshing the data and trying again
  } else if (error instanceof TechnicalError) {
    console.error('Technical error:', error.message);
    // Log for support team and show generic error
  } else {
    console.error('Unknown error:', error);
    // Generic error handling
  }

  // Optionally log the full error chain for debugging
  let currentError: Error | undefined = error;
  const errorChain: string[] = [];

  while (currentError) {
    errorChain.push(currentError.message);
    currentError = currentError.cause as Error | undefined;
  }

  if (errorChain.length > 1) {
    console.debug('Error chain:', errorChain.join(' → '));
  }
}

// Run and demonstrate the examples
function runExamples() {
  console.log('Example 1: User Validation');
  const validUser: User = { id: '123', name: 'Alice', email: 'alice@example.com', role: 'admin' };
  const invalidUser: User = { name: '', email: 'invalid-email', role: 'guest' };

  handleOperationResult(validateUser(validUser));
  handleOperationResult(validateUser(invalidUser));

  console.log('\nExample 2: Payment Processing');
  const validPayment: Payment = { amount: 50, currency: 'USD', paymentMethod: 'credit_card' };
  const invalidPayment: Payment = { amount: -10, currency: 'BTC', paymentMethod: 'crypto' };

  handleOperationResult(processPayment(validPayment));
  handleOperationResult(processPayment(invalidPayment));

  console.log('\nExample 3: Document Saving');
  const document: Document = { id: 'doc-123', version: 1, data: { title: 'Example' } };

  // Try multiple times to demonstrate different error types
  for (let i = 0; i < 5; i++) {
    console.log(`\nSave attempt ${i + 1}:`);
    handleOperationResult(saveDocument(document));
  }

  console.log('\nExample 4: Complex Operation');
  handleOperationResult(performComplexOperation('123')); // Should succeed
  handleOperationResult(performComplexOperation('999')); // Should fail with NotFoundError
}

// Run the examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

export {
  validateUser,
  processPayment,
  saveDocument,
  performComplexOperation,
  handleOperationResult,
  runExamples,
};
