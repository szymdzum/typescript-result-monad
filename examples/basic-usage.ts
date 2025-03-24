// Basic Usage Examples for Result Monad

import { Result } from '../src/result';

/**
 * Example 1: Basic Success and Failure
 * 
 * This demonstrates the most basic use case of creating success and failure results.
 */
function basicUsage() {
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
}

/**
 * Example 2: Handling operations that might throw
 * 
 * Instead of using try/catch blocks, we can use Result.fromThrowable to handle
 * functions that might throw exceptions.
 */
function divideNumbers(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero');
  }
  return a / b;
}

function exceptionHandling() {
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
}

/**
 * Example 3: Chaining operations with map and flatMap
 * 
 * This example shows how to chain operations that might fail without
 * extensive error checking at each step.
 */
function parseAndProcess() {
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
  
  // Valid JSON with missing field
  const missingFieldProcess = parseJSON('{"age": 30}')
    .flatMap(obj => extractField(obj, 'name'))
    .flatMap(name => processField(name));
  
  // Invalid JSON
  const invalidJsonProcess = parseJSON('{not valid json}')
    .flatMap(obj => extractField(obj, 'name'))
    .flatMap(name => processField(name));
  
  console.log('Valid process result:', validProcess.isSuccess); // true
  if (validProcess.isSuccess) {
    console.log('Processed value:', validProcess.value); // "JOHN"
  }
  
  console.log('Missing field process result:', missingFieldProcess.isFailure); // true
  if (missingFieldProcess.isFailure) {
    console.log('Missing field error:', missingFieldProcess.error.message); // "Field 'name' not found"
  }
  
  console.log('Invalid JSON process result:', invalidJsonProcess.isFailure); // true
  if (invalidJsonProcess.isFailure) {
    console.log('Invalid JSON error:', invalidJsonProcess.error.message); // SyntaxError
  }
}

/**
 * Example 4: Working with side effects using tap
 * 
 * This example shows how to perform side effects without breaking the chain.
 */
function sideEffectsExample() {
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
}

/**
 * Example 5: Providing fallback values
 * 
 * This example shows how to provide default values when operations fail.
 */
function fallbackExample() {
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
}

/**
 * Example 6: Working with Promises
 * 
 * This example shows how to convert between Results and Promises.
 */
async function promiseExample() {
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
  
  // Handling a failed Result as a Promise
  const failedResult = Result.fail<string, Error>(new Error('Operation failed'));
  try {
    const value = await failedResult.toPromise();
    console.log('Promise resolved with:', value);
  } catch (error) {
    console.error('Promise rejected with:', error);
  }
}

// Export examples to be run
export const examples = {
  basicUsage,
  exceptionHandling,
  parseAndProcess,
  sideEffectsExample,
  fallbackExample,
  promiseExample
};

// Example runner
async function runAllExamples() {
  console.log('=== Basic Usage ===');
  examples.basicUsage();
  
  console.log('\n=== Exception Handling ===');
  examples.exceptionHandling();
  
  console.log('\n=== Parse and Process ===');
  examples.parseAndProcess();
  
  console.log('\n=== Side Effects ===');
  examples.sideEffectsExample();
  
  console.log('\n=== Fallback Values ===');
  examples.fallbackExample();
  
  console.log('\n=== Promise Integration ===');
  await examples.promiseExample();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('Error running examples:', error);
  });
}

