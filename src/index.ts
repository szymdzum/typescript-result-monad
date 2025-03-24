/**
 * Main entry point for the ts-result-monad package.
 * Exports all components for easy access.
 *
 * @packageDocumentation
 *
 * ## Performance Considerations
 *
 * - This library is designed to be lightweight and have minimal overhead
 * - The implementation uses immutable objects with Object.freeze() which may have a slight performance impact
 * - For high-frequency operations (millions per second), consider benchmarking against alternatives
 * - Avoid unnecessary chaining of operations on large data sets
 * - The async methods use native Promises which are well-optimized in modern JavaScript engines
 *
 * ## Browser and Node.js Compatibility
 *
 * ### Browser Support
 * - Full compatibility with all modern browsers (Chrome, Firefox, Safari, Edge)
 * - IE11 is not supported due to the use of ES6+ features
 * - Transpilation may be required for older browsers
 *
 * ### Node.js Support
 * - Compatible with Node.js 16.x and above
 * - Uses ES Modules by default (package.json "type": "module")
 * - UMD build is provided for CommonJS compatibility via the "require" field in package.json exports
 *
 * ### Size
 * - ES module: ~8.6 kB (2.2 kB gzipped)
 * - UMD module: ~4.5 kB (1.6 kB gzipped)
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
