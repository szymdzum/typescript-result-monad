/**
 * Main entry point for the ts-result-monad package
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

// Export individual functions from Result (for tree-shaking optimization)
import { Result as ResultClass } from './result.js';

// Static methods as standalone functions
export const ok = ResultClass.ok;
export const fail = ResultClass.fail;
export const fromPromise = ResultClass.fromPromise;
export const fromThrowable = ResultClass.fromThrowable;
