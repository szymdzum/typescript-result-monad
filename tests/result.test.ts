import { describe, expect, test, vi } from 'vitest';
import { Result } from '../src/result';

describe('Result', () => {
  describe('Creation and basic properties', () => {
    test('should create a success result', () => {
      const result = Result.ok<number, Error>(42);

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe(42);
      expect(() => result.error).toThrow('Cannot access error of a successful result');
    });

    test('should create a failure result', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<string, Error>(error);

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
      expect(() => result.value).toThrow(/Cannot access value of a failed result/);
    });

    test('should allow undefined as a success value', () => {
      const result = Result.ok<undefined, Error>(undefined);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    test('should be immutable', () => {
      const result = Result.ok<number, Error>(42);

      // Verify the object is frozen
      expect(Object.isFrozen(result)).toBe(true);

      // Only test that we can't modify properties
      const testObj = result as any;
      const originalIsSuccess = testObj.isSuccess;

      try {
        testObj.isSuccess = !originalIsSuccess;
      } catch {
        // Expected to throw
      }

      // Value shouldn't change even if modification doesn't throw
      expect(testObj.isSuccess).toBe(originalIsSuccess);
    });
  });

  describe('map', () => {
    test('should map success value', () => {
      const result = Result.ok<number, Error>(42);
      const mapped = result.map(x => x * 2);

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(84);
    });

    test('should not map failure', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const mapped = result.map(x => x * 2);

      expect(mapped.isFailure).toBe(true);
      expect(mapped.error).toBe(error);
    });
  });

  describe('mapError', () => {
    test('should not map error for success', () => {
      const result = Result.ok<number, Error>(42);
      const mapped = result.mapError(e => new TypeError(e.message));

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(42);
    });

    test('should map error for failure', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const mapped = result.mapError(e => new TypeError(`Typed error: ${e.message}`));

      expect(mapped.isFailure).toBe(true);
      expect(mapped.error).toBeInstanceOf(TypeError);
      expect(mapped.error.message).toBe('Typed error: Something went wrong');
    });
  });

  describe('flatMap', () => {
    test('should flatMap success', () => {
      const result = Result.ok<number, Error>(42);
      const flatMapped = result.flatMap(x => Result.ok<string, Error>(`Value: ${x}`));

      expect(flatMapped.isSuccess).toBe(true);
      expect(flatMapped.value).toBe('Value: 42');
    });

    test('should not flatMap failure', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const flatMapped = result.flatMap(x => Result.ok<string, Error>(`Value: ${x}`));

      expect(flatMapped.isFailure).toBe(true);
      expect(flatMapped.error).toBe(error);
    });

    test('should propagate failure from flatMapped function', () => {
      const result = Result.ok<number, Error>(42);
      const flatMapped = result.flatMap(x =>
        Result.fail<string, Error>(new Error(`Error with value: ${x}`))
      );

      expect(flatMapped.isFailure).toBe(true);
      expect(flatMapped.error.message).toBe('Error with value: 42');
    });

    test('should chain multiple flatMap operations', () => {
      const parseJSON = (json: string): Result<any, Error> => {
        return Result.fromThrowable(() => JSON.parse(json));
      };

      const extractField = (obj: any, field: string): Result<string, Error> => {
        if (obj && field in obj) {
          return Result.ok(obj[field]);
        }
        return Result.fail(new Error(`Field '${field}' not found`));
      };

      const processField = (field: string): Result<string, Error> => {
        if (field.length > 3) {
          return Result.ok(field.toUpperCase());
        }
        return Result.fail(new Error('Field too short'));
      };

      const validProcess = parseJSON('{"name": "John", "age": 30}')
        .flatMap(obj => extractField(obj, 'name'))
        .flatMap(name => processField(name));

      expect(validProcess.isSuccess).toBe(true);
      expect(validProcess.value).toBe('JOHN');

      const missingFieldProcess = parseJSON('{"age": 30}')
        .flatMap(obj => extractField(obj, 'name'))
        .flatMap(name => processField(name));

      expect(missingFieldProcess.isFailure).toBe(true);
      expect(missingFieldProcess.error.message).toBe("Field 'name' not found");

      const invalidJsonProcess = parseJSON('{not valid json}')
        .flatMap(obj => extractField(obj, 'name'))
        .flatMap(name => processField(name));

      expect(invalidJsonProcess.isFailure).toBe(true);
      expect(invalidJsonProcess.error).toBeInstanceOf(Error);
    });
  });

  describe('tap and tapError', () => {
    test('should execute tap for success', () => {
      const mockFn = vi.fn();
      const result = Result.ok<number, Error>(42);
      const tapped = result.tap(mockFn);

      expect(tapped).toBe(result);
      expect(mockFn).toHaveBeenCalledWith(42);
    });

    test('should not execute tap for failure', () => {
      const mockFn = vi.fn();
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const tapped = result.tap(mockFn);

      expect(tapped).toBe(result);
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should execute tapError for failure', () => {
      const mockFn = vi.fn();
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const tapped = result.tapError(mockFn);

      expect(tapped).toBe(result);
      expect(mockFn).toHaveBeenCalledWith(error);
    });

    test('should not execute tapError for success', () => {
      const mockFn = vi.fn();
      const result = Result.ok<number, Error>(42);
      const tapped = result.tapError(mockFn);

      expect(tapped).toBe(result);
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('should allow chaining tap and tapError', () => {
      const successMock = vi.fn();
      const errorMock = vi.fn();

      const _result = Result.ok<number, Error>(42).tap(successMock).tapError(errorMock);

      expect(successMock).toHaveBeenCalledWith(42);
      expect(errorMock).not.toHaveBeenCalled();
    });
  });

  describe('match', () => {
    test('should call onSuccess for success', () => {
      const result = Result.ok<number, Error>(42);
      const matchResult = result.match(
        value => `Success: ${value}`,
        error => `Error: ${error.message}`
      );

      expect(matchResult).toBe('Success: 42');
    });

    test('should call onFailure for failure', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const matchResult = result.match(
        value => `Success: ${value}`,
        error => `Error: ${error.message}`
      );

      expect(matchResult).toBe('Error: Something went wrong');
    });
  });

  describe('getOrElse and getOrCall', () => {
    test('getOrElse should return value for success', () => {
      const result = Result.ok<number, Error>(42);
      expect(result.getOrElse(0)).toBe(42);
    });

    test('getOrElse should return default for failure', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      expect(result.getOrElse(0)).toBe(0);
    });

    test('getOrCall should return value for success', () => {
      const mockFn = vi.fn().mockReturnValue(0);
      const result = Result.ok<number, Error>(42);

      expect(result.getOrCall(mockFn)).toBe(42);
      expect(mockFn).not.toHaveBeenCalled();
    });

    test('getOrCall should call function for failure', () => {
      const error = new Error('Something went wrong');
      const mockFn = vi.fn(error => error.message.length);
      const result = Result.fail<number, Error>(error);

      expect(result.getOrCall(mockFn)).toBe(20); // "Something went wrong".length
      expect(mockFn).toHaveBeenCalledWith(error);
    });
  });

  describe('recover', () => {
    test('should not recover success', () => {
      const result = Result.ok<number, Error>(42);
      const recovered = result.recover(() => Result.ok<number, Error>(0));

      expect(recovered).toBe(result); // Should return the same instance
      expect(recovered.value).toBe(42);
    });

    test('should recover from failure to success', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const recovered = result.recover(() => Result.ok<number, Error>(0));

      expect(recovered.isSuccess).toBe(true);
      expect(recovered.value).toBe(0);
    });

    test('should allow continued failure on recover', () => {
      const error = new Error('Something went wrong');
      const newError = new Error('Recovery failed');
      const result = Result.fail<number, Error>(error);
      const recovered = result.recover(() => Result.fail<number, Error>(newError));

      expect(recovered.isFailure).toBe(true);
      expect(recovered.error).toBe(newError);
    });
  });

  describe('fromThrowable', () => {
    test('should capture function result', () => {
      const result = Result.fromThrowable(() => 42);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(42);
    });

    test('should capture Error exceptions', () => {
      const error = new Error('Function threw');
      const result = Result.fromThrowable(() => {
        throw error;
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    test('should wrap non-Error exceptions', () => {
      const result = Result.fromThrowable(() => {
        throw 'string error';
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe('string error');
    });

    test('should handle divide by zero example', () => {
      function divideNumbers(a: number, b: number): number {
        if (b === 0) {
          throw new Error('Division by zero');
        }
        return a / b;
      }

      const success = Result.fromThrowable(() => divideNumbers(10, 2));
      const failure = Result.fromThrowable(() => divideNumbers(10, 0));

      expect(success.isSuccess).toBe(true);
      expect(success.value).toBe(5);

      expect(failure.isFailure).toBe(true);
      expect(failure.error.message).toBe('Division by zero');
    });
  });

  describe('Promise integration', () => {
    test('toPromise should resolve for success', async () => {
      const result = Result.ok<number, Error>(42);
      await expect(result.toPromise()).resolves.toBe(42);
    });

    test('toPromise should reject for failure', async () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      await expect(result.toPromise()).rejects.toBe(error);
    });

    test('fromPromise should handle resolved promises', async () => {
      const promise = Promise.resolve(42);
      const result = await Result.fromPromise(promise);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(42);
    });

    test('fromPromise should handle rejected promises with Error', async () => {
      const error = new Error('Promise rejected');
      const promise = Promise.reject(error);
      const result = await Result.fromPromise(promise);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });
  });

  describe('asyncMap', () => {
    test('should asynchronously map success value', async () => {
      const result = Result.ok<number, Error>(42);
      const asyncMapped = await result.asyncMap(async value => value * 2);

      expect(asyncMapped.isSuccess).toBe(true);
      expect(asyncMapped.value).toBe(84);
    });

    test('should not apply asyncMap for failure', async () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const asyncMapped = await result.asyncMap(async value => value * 2);

      expect(asyncMapped.isFailure).toBe(true);
      expect(asyncMapped.error).toBe(error);
    });

    test('should handle errors in async mapping function', async () => {
      const result = Result.ok<number, Error>(42);
      const mappingError = new Error('Mapping failed');
      const asyncMapped = await result.asyncMap(async () => {
        throw mappingError;
      });

      expect(asyncMapped.isFailure).toBe(true);
      expect(asyncMapped.error.message).toBe(mappingError.message);
    });
  });

  describe('asyncFlatMap', () => {
    test('should asynchronously flatMap success value', async () => {
      const result = Result.ok<number, Error>(42);
      const asyncFlatMapped = await result.asyncFlatMap(async value =>
        Result.ok<string, Error>(value.toString())
      );

      expect(asyncFlatMapped.isSuccess).toBe(true);
      expect(asyncFlatMapped.value).toBe('42');
    });

    test('should not apply asyncFlatMap for failure', async () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const asyncFlatMapped = await result.asyncFlatMap(async value =>
        Result.ok<string, Error>(value.toString())
      );

      expect(asyncFlatMapped.isFailure).toBe(true);
      expect(asyncFlatMapped.error).toBe(error);
    });

    test('should handle errors in async flatMapping function', async () => {
      const result = Result.ok<number, Error>(42);
      const flatMappingError = new Error('FlatMapping failed');
      const asyncFlatMapped = await result.asyncFlatMap(async () => {
        throw flatMappingError;
      });

      expect(asyncFlatMapped.isFailure).toBe(true);
      expect(asyncFlatMapped.error.message).toBe(flatMappingError.message);
    });
  });

  describe('orElse', () => {
    test('should return the original result if it is a success', () => {
      const result = Result.ok<number, Error>(42);
      const alternative = Result.ok<number, Error>(99);
      const orElseResult = result.orElse(alternative);

      expect(orElseResult).toBe(result); // Should return the same instance
      expect(orElseResult.value).toBe(42);
    });

    test('should return the alternative result if original is a failure', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const alternative = Result.ok<number, Error>(99);
      const orElseResult = result.orElse(alternative);

      expect(orElseResult).toBe(alternative); // Should return the alternative instance
      expect(orElseResult.value).toBe(99);
    });

    test('alternative can also be a failure', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');
      const result1 = Result.fail<number, Error>(error1);
      const result2 = Result.fail<number, Error>(error2);
      const orElseResult = result1.orElse(result2);

      expect(orElseResult.isFailure).toBe(true);
      expect(orElseResult.error).toBe(error2);
    });
  });

  describe('toJSON', () => {
    test('should create a serializable object for success', () => {
      const result = Result.ok<number, Error>(42);
      const json = result.toJSON();

      expect(json).toEqual({
        success: true,
        value: 42,
      });
    });

    test('should create a serializable object for failure', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<number, Error>(error);
      const json = result.toJSON();

      expect(json).toEqual({
        success: false,
        error: {
          name: 'Error',
          message: 'Something went wrong',
        },
      });
    });

    test('should handle custom error types', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      const result = Result.fail<number, Error>(error);
      const json = result.toJSON();

      expect(json).toEqual({
        success: false,
        error: {
          name: 'CustomError',
          message: 'Custom error message',
        },
      });
    });
  });
});
