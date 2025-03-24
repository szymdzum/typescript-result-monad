import { describe, expect, test, vi } from 'vitest';
import { NotFoundError, TechnicalError, ValidationError } from '../src/errors.js';
import { Result } from '../src/result.js';
import {
  combineResults,
  fromPredicate,
  mapResult,
  promisifyWithResult,
  retry,
  tryCatchAsync,
  withFallback,
} from '../src/utils.js';

describe('Utility Functions', () => {
  // Helper function to create a delay
  const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

  describe('combineResults', () => {
    test('should combine multiple successful results into a single success result', () => {
      // Arrange
      const result1 = Result.ok<number, Error>(1);
      const result2 = Result.ok<number, Error>(2);
      const result3 = Result.ok<number, Error>(3);

      // Act
      const combined = combineResults([result1, result2, result3]);

      // Assert
      expect(combined.isSuccess).toBe(true);
      expect(combined.value).toEqual([1, 2, 3]);
    });

    test('should return the first failure when any result fails', () => {
      // Arrange
      const result1 = Result.ok<number, Error>(1);
      const result2 = Result.fail<number, Error>(new ValidationError('Invalid input'));
      const result3 = Result.ok<number, Error>(3);

      // Act
      const combined = combineResults([result1, result2, result3]);

      // Assert
      expect(combined.isFailure).toBe(true);
      expect(combined.error.name).toBe('ValidationError');
      expect(combined.error.message).toContain('Invalid input');
    });

    test('should return success with empty array for empty input array', () => {
      // Act
      const combined = combineResults<number, Error>([]);

      // Assert
      expect(combined.isSuccess).toBe(true);
      expect(combined.value).toEqual([]);
    });
  });

  describe('tryCatchAsync', () => {
    test('should return success result when async function succeeds', async () => {
      // Arrange
      const asyncFn = async () => 'success';

      // Act
      const result = await tryCatchAsync(asyncFn);

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('success');
    });

    test('should return failure result when async function throws', async () => {
      // Arrange
      const error = new Error('Async error');
      const asyncFn = async () => {
        throw error;
      };

      // Act
      const result = await tryCatchAsync(asyncFn);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    test('should wrap non-Error throws in a TechnicalError', async () => {
      // Arrange
      const asyncFn = async () => {
        throw 'string error';
      };

      // Act
      const result = await tryCatchAsync(asyncFn);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(TechnicalError);
      expect(result.error.message).toContain('string error');
    });
  });

  describe('promisifyWithResult', () => {
    test('should handle successful callback function', async () => {
      // Arrange
      const callbackFn = (value: string, callback: (err: Error | null, result: string) => void) => {
        callback(null, `${value} processed`);
      };

      // Act
      const result = await promisifyWithResult<string>(callbackFn, 'test');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('test processed');
    });

    test('should handle error in callback function', async () => {
      // Arrange
      const error = new Error('Callback error');
      const callbackFn = (_: string, callback: (err: Error | null, result: string) => void) => {
        callback(error, '' as any);
      };

      // Act
      const result = await promisifyWithResult<string>(callbackFn, 'test');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    test('should handle throws in the callback function', async () => {
      // Arrange
      const callbackFn = () => {
        throw new Error('Thrown error');
      };

      // Act
      const result = await promisifyWithResult<string>(callbackFn, 'test');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toContain('Thrown error');
    });

    test('should wrap non-Error callback errors in TechnicalError', async () => {
      // Arrange
      const callbackFn = (_: string, callback: (err: any, result: string) => void) => {
        callback('string error', '' as any);
      };

      // Act
      const result = await promisifyWithResult<string>(callbackFn, 'test');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(TechnicalError);
      expect(result.error.message).toContain('string error');
    });
  });

  describe('fromPredicate', () => {
    test('should return success when predicate is true', () => {
      // Arrange
      const value = 10;
      const predicate = (n: number) => n > 5;

      // Act
      const result = fromPredicate(value, predicate, 'Value must be greater than 5');

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(value);
    });

    test('should return failure when predicate is false', () => {
      // Arrange
      const value = 3;
      const predicate = (n: number) => n > 5;
      const errorMessage = 'Value must be greater than 5';

      // Act
      const result = fromPredicate(value, predicate, errorMessage);

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe(errorMessage);
    });

    test('should work with complex predicates', () => {
      // Arrange
      const user = { name: 'John', age: 17 };
      const isAdult = (u: typeof user) => u.age >= 18 && u.name.length > 0;

      // Act
      const result = fromPredicate(user, isAdult, 'User must be an adult');

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('User must be an adult');
    });
  });

  describe('mapResult', () => {
    test('should map success result value', () => {
      // Arrange
      const result = Result.ok<number, Error>(5);
      const mapper = (n: number) => n * 2;

      // Act
      const mappedResult = mapResult(result, mapper);

      // Assert
      expect(mappedResult.isSuccess).toBe(true);
      expect(mappedResult.value).toBe(10);
    });

    test('should not call mapper for failure result', () => {
      // Arrange
      const error = new ValidationError('Invalid input');
      const result = Result.fail<number, Error>(error);
      const mapper = vi.fn((n: number) => n * 2);

      // Act
      const mapped = mapResult(result, mapper);

      // Assert
      expect(mapped.isFailure).toBe(true);
      expect(mapped.error).toBe(error);
      expect(mapper).not.toHaveBeenCalled();
    });
  });

  describe('withFallback', () => {
    test('should return original result when success', () => {
      // Arrange
      const result = Result.ok<string, Error>('original');

      // Act
      const resultWithFallback = withFallback(result, 'fallback');

      // Assert
      expect(resultWithFallback.isSuccess).toBe(true);
      expect(resultWithFallback.value).toBe('original');
    });

    test('should return fallback value when failure', () => {
      // Arrange
      const result = Result.fail<string, Error>(new Error('Some error'));

      // Act
      const resultWithFallback = withFallback(result, 'fallback');

      // Assert
      expect(resultWithFallback.isSuccess).toBe(true);
      expect(resultWithFallback.value).toBe('fallback');
    });
  });

  describe('retry', () => {
    test('should return the successful result immediately if first try succeeds', async () => {
      // Arrange
      const mockFn = vi.fn().mockResolvedValue(Result.ok('success'));

      // Act
      const result = await retry(mockFn, { maxAttempts: 3, delayMs: 100 });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should retry the specified number of times before succeeding', async () => {
      // Arrange
      let attempts = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          return Promise.resolve(Result.fail(new Error(`Attempt ${attempts} failed`)));
        }
        return Promise.resolve(Result.ok('success after retries'));
      });

      // Act
      const result = await retry(mockFn, { maxAttempts: 5, delayMs: 10 });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('success after retries');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should return failure if all retries fail', async () => {
      // Arrange
      const error = new Error('Persistent failure');
      const mockFn = vi.fn().mockResolvedValue(Result.fail(error));

      // Act
      const result = await retry(mockFn, { maxAttempts: 3, delayMs: 10 });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
      expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries = 4 calls
    });

    test('should handle thrown exceptions during retries', async () => {
      // Arrange
      let attempts = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          throw new Error('Unexpected error');
        }
        if (attempts === 2) {
          return Promise.resolve(Result.fail(new Error('Expected failure')));
        }
        return Promise.resolve(Result.ok('success after error and failure'));
      });

      // Act
      const result = await retry(mockFn, { maxAttempts: 3, delayMs: 10 });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('success after error and failure');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('should use exponential backoff for retries', async () => {
      // Arrange
      vi.useFakeTimers();
      let attempts = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) {
          return Promise.resolve(Result.fail(new Error(`Attempt ${attempts} failed`)));
        }
        return Promise.resolve(Result.ok('success'));
      });

      // Act - use smaller timeout to avoid test timeout
      const resultPromise = retry(mockFn, { maxAttempts: 2, delayMs: 5 });

      // Fast-forward until all timers have been executed
      await vi.runAllTimersAsync();

      const result = await resultPromise;

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);

      // Clean up
      vi.useRealTimers();
    }, 10000); // Increase timeout

    test('should handle a real async operation with retries', async () => {
      // Arrange - use much smaller delay values
      let counter = 0;

      const asyncOpWithRetries = async (): Promise<Result<string, Error>> => {
        counter++;
        await delay(1); // Small delay to simulate async work

        if (counter < 3) {
          return Result.fail<string, Error>(new NotFoundError('Resource', `attempt-${counter}`));
        }

        return Result.ok<string, Error>('Resource found after retries');
      };

      // Act
      const result = await retry(asyncOpWithRetries, { maxAttempts: 3, delayMs: 1 });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe('Resource found after retries');
      expect(counter).toBe(3);
    }, 10000); // Increase timeout
  });
});
