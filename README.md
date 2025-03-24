# Result Monad for TypeScript

[![CI](https://github.com/szymdzum/ts-result-monad/actions/workflows/ci.yml/badge.svg)](https://github.com/szymdzum/ts-result-monad/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/ts-result-monad.svg)](https://www.npmjs.com/package/ts-result-monad)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A lightweight, zero-dependency TypeScript implementation of the Result monad pattern for elegant error handling without exceptions.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [API Reference](#api-reference)
  - [Result Class](#result-class)
  - [Utility Functions](#utility-functions)
  - [Error Types](#error-types)
- [Detailed Examples](#detailed-examples)
  - [Basic Usage](#basic-usage)
  - [Error Handling Patterns](#error-handling-patterns)
  - [Functional Composition](#functional-composition)
  - [Asynchronous Patterns](#asynchronous-patterns)
  - [Retry Utilities](#retry-utilities)
- [Examples](#examples)
  - [Basic Usage](#basic-usage-1)
  - [Functional Composition](#functional-composition-1)
  - [Error Handling & Recovery](#error-handling--recovery)
  - [Asynchronous Operations](#asynchronous-operations)
  - [Combining Results](#combining-results)
  - [Domain-Specific Error Types](#domain-specific-error-types)
- [Why Use Result?](#why-use-result)
- [License](#license)
- [Bundle Size](#bundle-size)
- [Tree-shaking](#tree-shaking)
- [Getting Started](#getting-started)

## Features

- 🛡️ **Type-safe error handling** - No more try/catch blocks or forgotten error cases
- 🔄 **Chainable operations** - Compose operations that might fail with elegant method chaining
- 🧩 **Comprehensive utilities** - Tools for working with async code, predicates, retries, and more
- 🔍 **Detailed error types** - Structured error hierarchy for different failure scenarios
- 🚫 **Zero dependencies** - Lightweight and simple to integrate into any project

## Installation

```bash
npm install ts-result-monad
# or
yarn add ts-result-monad
# or
pnpm add ts-result-monad
```

## API Reference

### Result Class

#### Static Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `ok` | `<T, E>(value?: T): Result<T, E>` | Creates a success Result with the given value |
| `fail` | `<T, E>(error: E): Result<T, E>` | Creates a failure Result with the given error |
| `fromThrowable` | `<T>(fn: () => T): Result<T, Error>` | Creates a Result from a function that might throw |
| `fromPromise` | `<T>(promise: Promise<T>): Promise<Result<T, Error>>` | Creates a Result from a Promise |

#### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `isSuccess` | `boolean` | Whether the Result represents a success |
| `isFailure` | `boolean` | Whether the Result represents a failure |
| `value` | `T` | The success value (throws if accessed on a failure) |
| `error` | `E` | The error value (throws if accessed on a success) |

#### Instance Methods

##### Transformation Methods
| Method | Signature | Description |
|--------|-----------|-------------|
| `map` | `<U>(fn: (value: T) => U): Result<U, E>` | Transforms the success value |
| `mapError` | `<U extends Error>(fn: (error: E) => U): Result<T, U>` | Transforms the error value |
| `flatMap` | `<U>(fn: (value: T) => Result<U, E>): Result<U, E>` | Chains operations that return Results |

##### Side Effect Methods
| Method | Signature | Description |
|--------|-----------|-------------|
| `tap` | `(fn: (value: T) => void): Result<T, E>` | Performs a side effect on success |
| `tapError` | `(fn: (error: E) => void): Result<T, E>` | Performs a side effect on failure |

##### Access & Recovery Methods
| Method | Signature | Description |
|--------|-----------|-------------|
| `match` | `<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U` | Pattern matching for both cases |
| `getOrElse` | `(defaultValue: T): T` | Returns the value or a default |
| `getOrCall` | `(fn: (error: E) => T): T` | Returns the value or computes one from the error |
| `recover` | `(fn: (error: E) => Result<T, E>): Result<T, E>` | Attempts to recover from an error |

##### Promise Integration
| Method | Signature | Description |
|--------|-----------|-------------|
| `toPromise` | `(): Promise<T>` | Converts the Result to a Promise |
| `asyncMap` | `<U>(fn: (value: T) => Promise<U>): Promise<Result<U, E>>` | Asynchronously transforms the success value |
| `asyncFlatMap` | `<U>(fn: (value: T) => Promise<Result<U, E>>): Promise<Result<U, E>>` | Chains async operations that return Results |

##### Serialization
| Method | Signature | Description |
|--------|-----------|-------------|
| `toJSON` | `(): { success: boolean; value?: T; error?: { name: string; message: string } }` | Converts the Result to a serializable object |

##### Access & Recovery Methods
| Method | Signature | Description |
|--------|-----------|-------------|
| `match` | `<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U` | Pattern matching for both cases |
| `getOrElse` | `(defaultValue: T): T` | Returns the value or a default |
| `getOrCall` | `(fn: (error: E) => T): T` | Returns the value or computes one from the error |
| `recover` | `(fn: (error: E) => Result<T, E>): Result<T, E>` | Attempts to recover from an error |
| `orElse` | `(alternative: Result<T, E>): Result<T, E>` | Returns an alternative Result if this is a failure |

### Utility Functions

#### Result Combinators
| Function | Signature | Description |
|----------|-----------|-------------|
| `combineResults` | `<T, E>(results: Result<T, E>[]): Result<T[], E>` | Combines multiple Results into one |
| `mapResult` | `<T, U, E>(result: Result<T, E>, mapper: (value: T) => U): Result<U, E>` | Maps a result to a different type |
| `withFallback` | `<T, E>(result: Result<T, E>, fallbackValue: T): Result<T, E>` | Creates a new result with a fallback value |

#### Async Utilities
| Function | Signature | Description |
|----------|-----------|-------------|
| `tryCatchAsync` | `<T>(fn: () => Promise<T>): Promise<Result<T, Error>>` | Executes async function and returns Result |
| `promisifyWithResult` | `<T>(fn: (...args: any[]) => void, ...args: any[]): Promise<Result<T, Error>>` | Converts callback-based functions to Promise-based Results |
| `retry` | `<T>(fn: () => Promise<Result<T, Error>>, retries?: number, delay?: number): Promise<Result<T, Error>>` | Retries an operation multiple times |

#### Conversion Utilities
| Function | Signature | Description |
|----------|-----------|-------------|
| `fromPredicate` | `<T>(value: T, predicate: (value: T) => boolean, errorMessage: string): Result<T, Error>` | Creates a Result based on a condition |

### Error Types

| Error Type | Extends | Purpose |
|------------|---------|---------|
| `ResultError` | `Error` | Base error class for all Result errors |
| `ValidationError` | `ResultError` | For input validation failures |
| `NotFoundError` | `ResultError` | For resource not found situations |
| `UnauthorizedError` | `ResultError` | For permission/authorization failures |
| `BusinessRuleError` | `ResultError` | For business rule violations |
| `TechnicalError` | `ResultError` | For technical/infrastructure issues |
| `TimeoutError` | `TechnicalError` | For operation timeouts |
| `ConcurrencyError` | `ResultError` | For concurrent modification issues |

## Detailed Examples

We've created several example files to demonstrate different patterns and use cases for the Result monad. These examples include comprehensive code with detailed comments to help you understand how to apply these patterns in your own projects.

### [Basic Usage](./examples/basic-usage.ts)
* Simple success/failure creation
* Exception handling with `fromThrowable`
* Chaining operations with `map` and `flatMap`
* Side effects with `tap` and `tapError`
* Default values with `getOrElse` and `getOrCall`
* Promise integration

### [Error Handling Patterns](./examples/error-handling.ts)
* Domain-specific error types for different scenarios
* Detailed validation with appropriate error types
* Business rule validations
* Error chain propagation
* Centralized error handling based on error type
* Error context enrichment

### [Functional Composition](./examples/functional-composition.ts)
* Data transformation pipelines
* Multi-step validation with early returns
* Advanced function composition with shared context
* Combining multiple Results
* Parsing and validation examples

### [Asynchronous Patterns](./examples/async-patterns.ts)
* Converting Promises to Results
* Chaining async Results
* Parallel execution with Results
* Converting callback-based APIs to Result-based
* Retry patterns with exponential backoff
* Timeout handling

### [Retry Utilities](./examples/retry.ts)
* Retrying API calls with transient errors
* Database connection retries
* Custom retry settings with file operations
* Chaining operations after retries

You can run any example directly with:

```bash
# Using ts-node
npx ts-node examples/basic-usage.ts

# Or with your TypeScript setup
npm run build && node dist/examples/basic-usage.js
```

## Examples

### Basic Usage

#### Importing

```typescript
import { Result } from 'ts-result-monad';
```

#### Creating Success and Failure Results

```typescript
// Creating a success result
const successResult = Result.ok<number, Error>(42);
console.log('Success result:', successResult.isSuccess); // true

// Creating a failure result
const failureResult = Result.fail<string, Error>(new Error('Something went wrong'));
console.log('Failure result:', failureResult.isFailure); // true

// Safely accessing values
if (successResult.isSuccess) {
  console.log('The value is:', successResult.value);
}

// Safely accessing errors
if (failureResult.isFailure) {
  console.log('The error is:', failureResult.error.message);
}
```

#### Handling Operations That Might Throw

```typescript
function divideNumbers(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

// Using Result to handle operations that might throw
const divideResult1 = Result.fromThrowable(() => divideNumbers(10, 2));
const divideResult2 = Result.fromThrowable(() => divideNumbers(10, 0));

// Pattern matching to handle both success and failure cases elegantly
const resultMessage1 = divideResult1.match(
  value => `Result: ${value}`,
  error => `Error: ${error.message}`
);

const resultMessage2 = divideResult2.match(
  value => `Result: ${value}`,
  error => `Error: ${error.message}`
);

console.log(resultMessage1); // "Result: 5"
console.log(resultMessage2); // "Error: Division by zero"
```

### Functional Composition

#### Chaining Operations with map and flatMap

```typescript
// Parse a JSON string into an object
function parseJSON(json: string): Result<any, Error> {
  return Result.fromThrowable(() => JSON.parse(json));
}

// Extract a specific field from the parsed object
function extractField(obj: any, field: string): Result<string, Error> {
  if (obj && field in obj) {
    return Result.ok(obj[field]);
  }
  return Result.fail(new Error(`Field '${field}' not found`));
}

// Process valid field data
function processField(field: string): Result<string, Error> {
  if (field.length > 3) {
    return Result.ok(field.toUpperCase());
  }
  return Result.fail(new Error('Field too short'));
}

// Chain all operations together in a clean, readable way
const validProcess = parseJSON('{"name": "John", "age": 30}')
  .flatMap(obj => extractField(obj, 'name'))
  .flatMap(name => processField(name));

console.log('Processed value:', validProcess.value); // "JOHN"

// Error handling is built-in - no need for try/catch
const invalidJSON = parseJSON('{invalid json}')
  .flatMap(obj => extractField(obj, 'name'))
  .flatMap(name => processField(name));

console.log('Is invalid JSON a success?', invalidJSON.isSuccess); // false
```

#### Working with Side Effects Using tap

```typescript
const result = Result.ok<number, Error>(42)
  .tap(value => {
    console.log('Side effect on success:', value);
    // Do something with the value without affecting the result chain
    // Perfect for logging, analytics, etc.
  })
  .tapError(error => {
    console.error('Side effect on error:', error.message);
    // Handle the error without affecting the result chain
    // Great for error reporting, logging, etc.
  });

// The original result is returned unchanged
console.log('Result value after side effects:', result.value); // 42
```

### Error Handling & Recovery

#### Providing Fallback Values

```typescript
const failedResult = Result.fail<number, Error>(new Error('Operation failed'));

// Get a default value if the operation failed
const valueWithDefault = failedResult.getOrElse(0);
console.log('Value with default:', valueWithDefault); // 0

// Compute a value based on the error
const computedValue = failedResult.getOrCall(error => {
  console.log('Handling error:', error.message);
  return -1;
});
console.log('Computed fallback value:', computedValue); // -1
```

#### Recovering from Errors

```typescript
const failedOperation = Result.fail<string, Error>(new Error('Network error'));

// Try to recover from the error by providing an alternative result
const recoveredResult = failedOperation.recover(error => {
  console.log('Attempting recovery from:', error.message);
  return Result.ok('Fallback value from cache');
});

console.log('Recovered successfully:', recoveredResult.isSuccess); // true
console.log('Recovered value:', recoveredResult.value); // "Fallback value from cache"
```

### Asynchronous Operations

#### Working with Promises

```typescript
// Convert a Promise to a Result
async function fetchData() {
  const promiseResult = await Result.fromPromise(
    fetch('https://api.example.com/data')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
      })
  );

  // Handle the Result from the Promise
  return promiseResult.match(
    data => ({ success: true, data }),
    error => ({ success: false, error: error.message })
  );
}

// Convert a Result to a Promise
const successResult = Result.ok<string, Error>('Hello, world!');
try {
  const value = await successResult.toPromise();
  console.log('Promise resolved with:', value); // "Hello, world!"
} catch (error) {
  console.error('Promise rejected with:', error);
}
```

#### Using Async Transformations

```typescript
// Using asyncMap to transform a value with an async function
async function processDataAsync() {
  const result = Result.ok<number, Error>(42);

  // Asynchronously transform the value
  const asyncResult = await result.asyncMap(async (num) => {
    // Simulate an API call or other async operation
    const response = await fetch(`https://api.example.com/multiply?value=${num}`);
    const data = await response.json();
    return data.result; // Assume this is 84 (42 * 2)
  });

  // If the async operation succeeds
  if (asyncResult.isSuccess) {
    console.log('Processed data:', asyncResult.value); // 84
  }
}

// Using asyncFlatMap for chaining async operations that return Results
async function validateAndProcessAsync(userId: string) {
  const userResult = Result.ok<string, Error>(userId);

  // Chain multiple async operations
  const finalResult = await userResult
    .asyncFlatMap(async (id) => {
      // Fetch user data
      const userData = await fetchUserData(id);
      return userData.isSuccess
        ? userData
        : Result.fail<UserData, Error>(new Error('User fetch failed'));
    })
    .asyncFlatMap(async (user) => {
      // Process user permissions
      const permissions = await checkPermissions(user);
      return permissions;
    });

  return finalResult;
}
```

#### Using orElse for Fallback Results

```typescript
// Try primary data source, fall back to backup if it fails
async function getData(): Promise<Result<string, Error>> {
  const primaryResult = await fetchFromPrimary();

  // If primary fails, try backup instead
  return primaryResult.orElse(await fetchFromBackup());
}

// Can also be used with synchronous operations
function getCachedOrCompute(key: string): Result<string, Error> {
  const cachedResult = getCachedValue(key);

  // If no cached value, compute it
  return cachedResult.orElse(computeValue(key));
}
```

#### JSON Serialization for Logging and Storage

```typescript
function processAndLog(input: string) {
  const result = processInput(input);

  // Convert to JSON-friendly object for logging
  const logObject = result.toJSON();
  logger.info('Processing result', logObject);

  // The logObject will look like:
  // Success case: { success: true, value: "processed data" }
  // Failure case: { success: false, error: { name: "ValidationError", message: "Invalid input" } }

  return result;
}
```

#### Retrying Operations

```typescript
import { Result, retry, tryCatchAsync } from 'ts-result-monad';

// Fetch data with potential network issues
async function fetchDataFromAPI(url: string): Promise<Result<any, Error>> {
  return await tryCatchAsync(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  });
}

// Retry with exponential backoff (5 retries, starting with 1s delay)
const apiResult = await retry(
  () => fetchDataFromAPI('https://api.example.com/data'),
  5,    // number of retries
  1000  // initial delay in ms (doubles after each attempt)
);

if (apiResult.isSuccess) {
  console.log('API call succeeded after retries:', apiResult.value);
} else {
  console.error('API call failed after all retries:', apiResult.error.message);
}
```

### Combining Results

#### Working with Multiple Operations

```typescript
import { Result, combineResults } from 'ts-result-monad';

// Multiple independent operations
const results = [
  Result.ok<number, Error>(1),
  Result.ok<number, Error>(2),
  Result.ok<number, Error>(3)
];

const combined = combineResults(results);
console.log('All succeeded?', combined.isSuccess); // true
console.log('Combined values:', combined.value); // [1, 2, 3]

// If any operation fails, the combined result fails
const mixedResults = [
  Result.ok<number, Error>(1),
  Result.fail<number, Error>(new Error('Second operation failed')),
  Result.ok<number, Error>(3)
];

const mixedCombined = combineResults(mixedResults);
console.log('Mixed succeeded?', mixedCombined.isSuccess); // false
console.log('Error message:', mixedCombined.error.message); // "Second operation failed"
```

### Domain-Specific Error Types

```typescript
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
  TechnicalError,
  TimeoutError,
  ConcurrencyError
} from 'ts-result-monad';

// User validation example
function validateUser(user: any): Result<any, Error> {
  if (!user.name) {
    return Result.fail(new ValidationError('User name is required'));
  }

  if (!user.id) {
    return Result.fail(new NotFoundError('User', user.email));
  }

  if (user.role !== 'admin') {
    return Result.fail(new UnauthorizedError('Only admins can perform this action'));
  }

  return Result.ok(user);
}

// Process payment example
function processPayment(paymentInfo: any): Result<string, Error> {
  if (paymentInfo.amount <= 0) {
    return Result.fail(new BusinessRuleError('Payment amount must be positive'));
  }

  if (!paymentInfo.paymentMethod) {
    return Result.fail(new ValidationError('Payment method is required'));
  }

  // Simulate payment processing
  try {
    // Success case
    return Result.ok('Transaction ID: ' + Math.random().toString(36).substring(2, 15));
  } catch (e) {
    // Different error types based on the failure reason
    return Result.fail(new TechnicalError('Payment gateway connection failed', e as Error));
  }
}
```

## Why Use Result?

### Problems with Traditional Error Handling

1. **Exception handling is implicit** - Callers can easily forget to catch exceptions
2. **Type information is lost** - Try/catch blocks don't preserve the return type
3. **Control flow is obscured** - Exceptions create non-linear, hard to follow code paths
4. **Error handling is scattered** - Multiple catch blocks lead to duplicated error handling logic

### Benefits of Result Pattern

1. **Explicit error handling** - Errors become first-class citizens in your code
2. **Type-safe** - TypeScript's type system ensures you handle both success and failure
3. **Composable** - Chain operations with clear error propagation
4. **Centralized error handling** - Handle errors in a single place at the end of the chain
5. **Testable** - Easier to test both success and failure paths

## License

MIT

## Bundle Size

The package is designed to be lightweight:

| Format | Size    | Gzipped |
|--------|---------|---------|
| ES     | 8.60 kB | 2.19 kB |
| UMD    | 4.51 kB | 1.60 kB |

## Tree-shaking

This package supports tree-shaking out of the box. You can selectively import only the specific components you need to minimize your bundle size:

```typescript
// Import just what you need
import { Result } from 'ts-result-monad';

// Or specific utilities
import { tryCatchAsync, retry } from 'ts-result-monad';

// Or specific error types
import { ValidationError, NotFoundError } from 'ts-result-monad';
```

For even more optimized bundles, you can import the static methods of Result as standalone functions:

```typescript
// Instead of Result.ok() and Result.fail()
import { ok, fail, fromThrowable, fromPromise } from 'ts-result-monad';

// Examples
const success = ok(42);
const failure = fail(new Error('Something went wrong'));
const result = fromThrowable(() => JSON.parse('{"valid": "json"}'));
```

## Getting Started

```bash
npm install ts-result-monad
# or
yarn add ts-result-monad
# or
pnpm add ts-result-monad
```
