# TypeScript Result Monad

A lightweight, zero-dependency TypeScript implementation of the Result monad pattern for elegant error handling without exceptions.

## Features

- 🛡️ **Type-safe error handling** - No more try/catch blocks or forgotten error cases
- 🔄 **Chainable operations** - Compose operations that might fail with elegant method chaining
- 🧩 **Comprehensive utilities** - Tools for working with async code, predicates, retries, and more
- 🔍 **Detailed error types** - Structured error hierarchy for different failure scenarios
- 🚫 **Zero dependencies** - Lightweight and simple to integrate into any project

## Installation

```bash
npm install typescript-result-monad
```

## Basic Usage

### Importing

```typescript
import { Result } from 'typescript-result-monad';
```

### Creating Success and Failure Results

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

### Handling Operations That Might Throw

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

console.log('Division succeeded:', divideResult1.isSuccess); // true
console.log('Division failed:', divideResult2.isFailure); // true

// Match pattern to handle both cases in a functional way
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

### Chaining Operations with map and flatMap

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

// Valid JSON with valid field
const validProcess = parseJSON('{"name": "John", "age": 30}')
  .flatMap(obj => extractField(obj, 'name'))
  .flatMap(name => processField(name));

console.log('Processed value:', validProcess.value); // "JOHN"
```

### Working with Side Effects Using tap

```typescript
const result = Result.ok<number, Error>(42)
  .tap(value => {
    console.log('Side effect on success:', value);
    // Do something with the value, like logging or analytics
  })
  .tapError(error => {
    console.error('Side effect on error:', error.message);
    // Handle the error, like logging or reporting
  });

// The original result is returned unchanged
console.log('Result after side effects:', result.isSuccess); // true
console.log('Result value after side effects:', result.value); // 42
```

### Providing Fallback Values

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

### Working with Promises

```typescript
// Convert a Promise to a Result
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
promiseResult.match(
  data => console.log('API data:', data),
  error => console.error('API Error:', error.message)
);

// Convert a Result to a Promise
const successResult = Result.ok<string, Error>('Hello, world!');
try {
  const value = await successResult.toPromise();
  console.log('Promise resolved with:', value);
} catch (error) {
  console.error('Promise rejected with:', error);
}
```

## Advanced Usage

### Retrying Operations

The `retry` utility allows you to automatically retry operations that might fail due to transient issues:

```typescript
import { Result, retry, tryCatchAsync } from 'typescript-result-monad';

// Example: Retrying an API call that might experience temporary network issues
async function fetchDataFromAPI(url: string): Promise<Result<any, Error>> {
  console.log(`Attempting to fetch data from ${url}...`);
  
  return await tryCatchAsync(async () => {
    // Your API call logic here
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  });
}

// Using retry with default settings (3 retries)
const apiResult = await retry(() => fetchDataFromAPI('https://api.example.com/data'));

// Using custom retry settings (5 retries with a starting delay of 1000ms)
const customRetryResult = await retry(
  () => fetchDataFromAPI('https://api.example.com/data'), 
  5,  // number of retries
  1000 // initial delay in ms (doubles after each attempt)
);

// Handling the result
if (apiResult.isSuccess) {
  console.log('API call succeeded:', apiResult.value);
} else {
  console.error('API call failed after all retries:', apiResult.error.message);
}
```

### Combining Multiple Results

You can combine multiple Result instances into a single Result:

```typescript
import { Result, combineResults } from 'typescript-result-monad';

const results = [
  Result.ok<number, Error>(1),
  Result.ok<number, Error>(2),
  Result.ok<number, Error>(3)
];

const combined = combineResults(results);
// If all results are successful, combined.value will be [1, 2, 3]
// If any result fails, combined will be a failure with the first error
```

### Custom Error Types

The library includes several pre-defined error types for common scenarios:

```typescript
import { 
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  BusinessRuleError,
  TechnicalError,
  TimeoutError,
  ConcurrencyError
} from 'typescript-result-monad';

// Using custom error types for specific failure cases
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
```

## API Reference

### Result Class

#### Static Methods

- `ok<T, E>(value?: T): Result<T, E>` - Creates a success Result with the given value
- `fail<T, E>(error: E): Result<T, E>` - Creates a failure Result with the given error
- `fromThrowable<T>(fn: () => T): Result<T, Error>` - Creates a Result from a function that might throw
- `fromPromise<T>(promise: Promise<T>): Promise<Result<T, Error>>` - Creates a Result from a Promise

#### Instance Properties

- `isSuccess: boolean` - Whether the Result represents a success
- `isFailure: boolean` - Whether the Result represents a failure
- `value: T` - The success value (throws if accessed on a failure)
- `error: E` - The error value (throws if accessed on a success)

#### Instance Methods

- `map<U>(fn: (value: T) => U): Result<U, E>` - Transforms the success value
- `mapError<U extends Error>(fn: (error: E) => U): Result<T, U>` - Transforms the error value
- `flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E>` - Chains operations that return Results
- `tap(fn: (value: T) => void): Result<T, E>` - Performs a side effect on success
- `tapError(fn: (error: E) => void): Result<T, E>` - Performs a side effect on failure
- `match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U` - Pattern matching for both cases
- `getOrElse(defaultValue: T): T` - Returns the value or a default
- `getOrCall(fn: (error: E) => T): T` - Returns the value or computes one from the error
- `recover(fn: (error: E) => Result<T, E>): Result<T, E>` - Attempts to recover from an error
- `toPromise(): Promise<T>` - Converts the Result to a Promise

### Utility Functions

- `combineResults<T, E>(results: Result<T, E>[]): Result<T[], E>` - Combines multiple Results into one
- `tryCatchAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>>` - Executes async function and returns Result
- `promisifyWithResult<T>(fn: (...args: any[]) => void, ...args: any[]): Promise<Result<T, Error>>` - Converts callback-based functions to Promise<Result>
- `fromPredicate<T>(value: T, predicate: (value: T) => boolean, errorMessage: string): Result<T, Error>` - Creates a Result based on a condition
- `mapResult<T, U, E>(result: Result<T, E>, mapper: (value: T) => U): Result<U, E>` - Maps a result to a different type
- `withFallback<T, E>(result: Result<T, E>, fallbackValue: T): Result<T, E>` - Creates a new result with a fallback value
- `retry<T>(fn: () => Promise<Result<T, Error>>, retries?: number, delay?: number): Promise<Result<T, Error>>` - Retries an operation multiple times

### Error Types

- `ResultError` - Base error class for all Result errors
- `ValidationError` - For input validation failures
- `NotFoundError` - For resource not found situations
- `UnauthorizedError` - For permission/authorization failures
- `BusinessRuleError` - For business rule violations
- `TechnicalError` - For technical/infrastructure issues
- `TimeoutError` - For operation timeouts
- `ConcurrencyError` - For concurrent modification issues

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

