import { CancellationError } from './errors.js';

/**
 * A generic result class for handling success and failure outcomes
 * without relying on exceptions for control flow.
 *
 * @remarks
 * When working with recursive structures, be cautious of stack overflow issues
 * when chaining too many operations. For deeply nested structures, consider
 * using iterative approaches or limiting recursion depth.
 */
export class Result<T, E extends Error> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;
  private readonly _isCancelled: boolean = false;

  private constructor(isSuccess: boolean, error?: E, value?: T, isCancelled = false) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
    this._isCancelled = isCancelled;

    // Freeze the object to prevent modification
    Object.freeze(this);
  }

  /**
   * Creates a success result with the given value
   */
  public static ok<U, E extends Error>(value?: U): Result<U, E> {
    return new Result<U, E>(true, undefined, value);
  }

  /**
   * Creates a failure result with the given error
   */
  public static fail<U, E extends Error>(error: E): Result<U, E> {
    return new Result<U, E>(false, error);
  }

  /**
   * Creates a cancelled result to represent an operation that was cancelled
   * (e.g., due to an AbortController signal or timeout)
   */
  public static cancelled<T, E extends Error>(operationId?: string): Result<T, E> {
    return new Result<T, E>(
      false,
      new CancellationError('Operation was cancelled', operationId) as unknown as E,
      undefined,
      true
    );
  }

  /**
   * Checks if the result represents a cancelled operation.
   * Useful for distinguishing between normal failures and cancellations.
   */
  public get isCancelled(): boolean {
    return this._isCancelled;
  }

  /**
   * Returns the success value
   * @throws Error if the result is a failure
   */
  public get value(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot access value of a failed result. Error: ${this._error?.message}`);
    }

    return this._value as T;
  }

  /**
   * Returns the error
   * @throws Error if the result is a success
   */
  public get error(): E {
    if (!this.isFailure) {
      throw new Error('Cannot access error of a successful result');
    }

    return this._error as E;
  }

  /**
   * Maps the result value if successful.
   */
  public map<U>(f: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }
    return Result.ok<U, E>(f(this._value as T));
  }

  /**
   * Maps the result error if failed.
   */
  public mapError<U extends Error>(f: (error: E) => U): Result<T, U> {
    if (this.isSuccess) {
      return Result.ok<T, U>(this._value as T);
    }
    return Result.fail<T, U>(f(this._error as E));
  }

  /**
   * Chain results together.
   */
  public flatMap<U>(f: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }
    return f(this._value as T);
  }

  /**
   * Execute a side effect function if the result is a success
   */
  public tap(f: (value: T) => void): Result<T, E> {
    if (this.isSuccess) {
      f(this._value as T);
    }
    return this;
  }

  /**
   * Execute a side effect function if the result is a failure
   */
  public tapError(f: (error: E) => void): Result<T, E> {
    if (this.isFailure) {
      f(this._error as E);
    }
    return this;
  }

  /**
   * Match on the result and return a value based on success or failure
   */
  public match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    if (this.isSuccess) {
      return onSuccess(this._value as T);
    }
    return onFailure(this._error as E);
  }

  /**
   * Return an alternative value if the result is a failure
   */
  public getOrElse(defaultValue: T): T {
    return this.isSuccess ? (this._value as T) : defaultValue;
  }

  /**
   * Return a value computed from a function if the result is a failure
   */
  public getOrCall(f: (error: E) => T): T {
    return this.isSuccess ? (this._value as T) : f(this._error as E);
  }

  /**
   * Try to recover from an error by applying a function that returns a new result
   */
  public recover(f: (error: E) => Result<T, E>): Result<T, E> {
    if (this.isSuccess) {
      return this;
    }
    return f(this._error as E);
  }

  /**
   * Convert a Result to a Promise
   */
  public toPromise(): Promise<T> {
    if (this.isSuccess) {
      return Promise.resolve(this._value as T);
    }
    return Promise.reject(this._error);
  }

  /**
   * Asynchronously maps the result value if successful.
   * Allows transforming the value using a function that returns a Promise.
   *
   * @param f - Async function to transform the value
   * @param abortSignal - Optional AbortSignal to cancel the operation
   */
  public async asyncMap<U>(
    f: (value: T) => Promise<U>,
    abortSignal?: AbortSignal
  ): Promise<Result<U, E>> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }

    try {
      // If the operation is already aborted, return a cancelled result
      if (abortSignal?.aborted) {
        return Result.cancelled<U, E>('Operation was aborted');
      }

      // Create a promise that can be cancelled
      const resultPromise = f(this._value as T);

      // If the signal is provided, handle cancellation
      if (abortSignal) {
        // Create a promise that rejects if the signal is aborted
        const abortPromise = new Promise<U>((_, reject) => {
          abortSignal.addEventListener(
            'abort',
            () => {
              reject(new Error('Operation aborted'));
            },
            { once: true }
          );
        });

        // Race the result promise against the abort promise
        try {
          const value = await Promise.race([resultPromise, abortPromise]);
          return Result.ok<U, E>(value);
        } catch (error) {
          if (abortSignal.aborted) {
            return Result.cancelled<U, E>('Operation was aborted');
          }
          return Result.fail<U, E>(
            error instanceof Error ? (error as E) : (new Error(String(error)) as E)
          );
        }
      }

      // If no signal is provided, just await the result
      const mappedValue = await resultPromise;
      return Result.ok<U, E>(mappedValue);
    } catch (error) {
      return Result.fail<U, E>(
        error instanceof Error ? (error as E) : (new Error(String(error)) as E)
      );
    }
  }

  /**
   * Asynchronously chain results together.
   * Allows chaining with a function that returns a Promise<Result>.
   *
   * @param f - Async function to transform the value
   * @param abortSignal - Optional AbortSignal to cancel the operation
   */
  public async asyncFlatMap<U>(
    f: (value: T) => Promise<Result<U, E>>,
    abortSignal?: AbortSignal
  ): Promise<Result<U, E>> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error as E);
    }

    try {
      // If the operation is already aborted, return a cancelled result
      if (abortSignal?.aborted) {
        return Result.cancelled<U, E>('Operation was aborted');
      }

      // Create a promise that can be cancelled
      const resultPromise = f(this._value as T);

      // If the signal is provided, handle cancellation
      if (abortSignal) {
        // Create a promise that rejects if the signal is aborted
        const abortPromise = new Promise<Result<U, E>>((_, reject) => {
          abortSignal.addEventListener(
            'abort',
            () => {
              reject(new Error('Operation aborted'));
            },
            { once: true }
          );
        });

        // Race the result promise against the abort promise
        try {
          return await Promise.race([resultPromise, abortPromise]);
        } catch (error) {
          if (abortSignal.aborted) {
            return Result.cancelled<U, E>('Operation was aborted');
          }
          return Result.fail<U, E>(
            error instanceof Error ? (error as E) : (new Error(String(error)) as E)
          );
        }
      }

      // If no signal is provided, just await the result
      return await resultPromise;
    } catch (error) {
      return Result.fail<U, E>(
        error instanceof Error ? (error as E) : (new Error(String(error)) as E)
      );
    }
  }

  /**
   * Return an alternative result if this result is a failure.
   * Similar to withFallback utility but as an instance method.
   */
  public orElse(alternative: Result<T, E>): Result<T, E> {
    return this.isSuccess ? this : alternative;
  }

  /**
   * Convert result to a JSON-serializable object.
   * Useful for logging, debugging, or storing the result.
   */
  public toJSON(): { success: boolean; value?: T; error?: { name: string; message: string } } {
    if (this.isSuccess) {
      return {
        success: true,
        value: this._value as T,
      };
    }

    return {
      success: false,
      error: {
        name: this._error?.name || 'Error',
        message: this._error?.message || 'Unknown error',
      },
    };
  }

  /**
   * Create a Result from a Promise with cancellation support
   *
   * @param promise The promise to convert to a Result
   * @param abortSignal Optional AbortSignal to support cancellation
   */
  public static async fromPromise<U>(
    promise: Promise<U>,
    abortSignal?: AbortSignal
  ): Promise<Result<U, Error>> {
    try {
      // If already aborted, return a cancelled result
      if (abortSignal?.aborted) {
        return Result.cancelled<U, Error>('Operation was aborted');
      }

      // If an abort signal is provided
      if (abortSignal) {
        // Create a promise that rejects when the signal is aborted
        const abortPromise = new Promise<U>((_, reject) => {
          abortSignal.addEventListener(
            'abort',
            () => {
              reject(new Error('Operation aborted'));
            },
            { once: true }
          );
        });

        // Race the original promise with the abort promise
        try {
          const result = await Promise.race([promise, abortPromise]);
          return Result.ok<U, Error>(result);
        } catch (error) {
          if (abortSignal.aborted) {
            return Result.cancelled<U, Error>('Operation was aborted');
          }
          return Result.fail<U, Error>(error instanceof Error ? error : new Error(String(error)));
        }
      }

      // No abort signal, just handle the promise normally
      const value = await promise;
      return Result.ok<U, Error>(value);
    } catch (error) {
      return Result.fail<U, Error>(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Create a Result from a function that might throw
   */
  public static fromThrowable<U>(f: () => U): Result<U, Error> {
    try {
      return Result.ok<U, Error>(f());
    } catch (error) {
      return Result.fail<U, Error>(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
