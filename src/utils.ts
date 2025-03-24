import { TechnicalError } from './errors.js';
import { Result } from './result.js';

/**
 * Combines multiple result values into a single result containing an array of values
 * @param results Array of Results to combine
 * @returns A Result containing either an array of all success values or the first error
 */
export function combineResults<T, E extends Error>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (result.isFailure) {
      return Result.fail<T[], E>(result.error);
    }
    values.push(result.value);
  }

  return Result.ok<T[], E>(values);
}

/**
 * Runs an async function and converts the result to a Result
 * @param fn The async function to execute
 * @returns A Result containing either the function result or any error that occurred
 */
export async function tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const result = await fn();
    return Result.ok<T, Error>(result);
  } catch (error) {
    return Result.fail<T, Error>(
      error instanceof Error ? error : new TechnicalError(String(error))
    );
  }
}

/**
 * Wraps a callback-style function to return a Promise<Result>
 * @param fn Function with a Node.js style callback (error, result)
 * @param args Arguments to pass to the function
 * @returns Promise that resolves to a Result
 */
export function promisifyWithResult<T>(
  fn: (...args: any[]) => void,
  ...args: any[]
): Promise<Result<T, Error>> {
  return new Promise((resolve) => {
    try {
      fn(...args, (error: any, result: T) => {
        if (error) {
          resolve(
            Result.fail<T, Error>(
              error instanceof Error ? error : new TechnicalError(String(error))
            )
          );
        } else {
          resolve(Result.ok<T, Error>(result));
        }
      });
    } catch (error) {
      resolve(
        Result.fail<T, Error>(error instanceof Error ? error : new TechnicalError(String(error)))
      );
    }
  });
}

/**
 * Converts a predicate function to a Result
 * @param value The value to test
 * @param predicate The predicate function
 * @param errorMessage Error message if predicate fails
 * @returns Result with the value if predicate passes, or error if it fails
 */
export function fromPredicate<T>(
  value: T,
  predicate: (value: T) => boolean,
  errorMessage: string
): Result<T, Error> {
  return predicate(value)
    ? Result.ok<T, Error>(value)
    : Result.fail<T, Error>(new Error(errorMessage));
}

/**
 * Maps a result to a different type based on a mapping function
 * @param result Result to map
 * @param mapper Function to transform the value
 * @returns Result with transformed value
 */
export function mapResult<T, U, E extends Error>(
  result: Result<T, E>,
  mapper: (value: T) => U
): Result<U, E> {
  return result.map(mapper);
}

/**
 * Creates a new result with a fallback value if the original result is a failure
 * @param result Original result
 * @param fallbackValue Value to use if result is a failure
 * @returns A new result that's always successful
 */
export function withFallback<T, E extends Error>(
  result: Result<T, E>,
  fallbackValue: T
): Result<T, E> {
  return result.isSuccess ? result : Result.ok<T, E>(fallbackValue);
}

/**
 * Attempt to execute a function multiple times until it succeeds
 * @param fn Function to retry
 * @param options Options for retry behavior
 * @returns Result of the function execution
 */
export async function retry<T>(
  fn: () => Promise<Result<T, Error>>,
  options: { maxAttempts?: number; delayMs?: number } = {}
): Promise<Result<T, Error>> {
  const maxAttempts = options.maxAttempts ?? 3;
  let currentDelay = options.delayMs ?? 300;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (result.isSuccess) {
        return result;
      }
      lastError = result.error;
    } catch (error) {
      lastError = error instanceof Error ? error : new TechnicalError(String(error));
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      // Exponential backoff
      const nextDelay = currentDelay * 2;
      currentDelay = nextDelay;
    }
  }

  return Result.fail<T, Error>(
    lastError || new TechnicalError(`Failed after ${maxAttempts} attempts`)
  );
}
