/**
 * Main entry point for the typescript-result-monad package
 * Exports all components for easy access
 */

// Import types
import './types.js';

// Export the Result class
export { Result } from './result.js';

// Export all error types
export {
  ResultError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
  TechnicalError,
  TimeoutError,
  ConcurrencyError,
} from './errors.js';

// Export all utility functions
export {
  combineResults,
  tryCatchAsync,
  promisifyWithResult,
  fromPredicate,
  mapResult,
  withFallback,
  retry,
} from './utils.js';
