import { Result } from '../src/result';
import { retry, tryCatchAsync } from '../src/utils';

/**
 * This file demonstrates async patterns with the Result monad.
 * It shows how to handle asynchronous operations safely while
 * maintaining proper error handling.
 */

// Example 1: Converting Promises to Results
async function fetchUserData(userId: string): Promise<Result<any, Error>> {
  // Simulate API call
  return await tryCatchAsync(async () => {
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 200));

    if (userId === '123') {
      return {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      };
    }

    throw new Error(`User not found: ${userId}`);
  });
}

// Example 2: Chaining async Results
async function processUserData(userId: string): Promise<Result<string, Error>> {
  // First async operation
  const userResult = await fetchUserData(userId);

  // Chain with flatMap for elegant composition
  return userResult.flatMap(user => {
    // Validate user data
    if (!user.email) {
      return Result.fail(new Error('User email is missing'));
    }

    // Process data and return a new Result
    return Result.ok(`${user.name} <${user.email}>`);
  });
}

// Example 3: Parallel execution with Results
async function fetchMultipleUsers(userIds: string[]): Promise<Result<any[], Error>> {
  try {
    // Execute multiple async operations in parallel
    const userPromises = userIds.map(id => fetchUserData(id));

    // Wait for all promises to resolve
    const userResults = await Promise.all(userPromises);

    // Check if any operation failed
    const failedResult = userResults.find(result => result.isFailure);
    if (failedResult) {
      return Result.fail(failedResult.error);
    }

    // Extract values from successful results
    const users = userResults.map(result => result.value);
    return Result.ok(users);
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error(String(error)));
  }
}

// Example 4: Converting Promise-based APIs to Result-based
function promiseToResult<T>(promise: Promise<T>): Promise<Result<T, Error>> {
  return promise
    .then(value => Result.ok<T, Error>(value))
    .catch(error =>
      Result.fail<T, Error>(error instanceof Error ? error : new Error(String(error)))
    );
}

// Example callback-based function (Node.js style)
function readFileCallback(
  path: string,
  callback: (error: Error | null, data?: string) => void
): void {
  // Simulate file reading with callbacks
  setTimeout(() => {
    if (path === 'exists.txt') {
      callback(null, 'File content here');
    } else {
      callback(new Error(`File not found: ${path}`));
    }
  }, 100);
}

// Convert callback-based function to Promise-based
function readFilePromise(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    readFileCallback(path, (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data!);
      }
    });
  });
}

// Convert Promise-based function to Result-based
async function readFileResult(path: string): Promise<Result<string, Error>> {
  return promiseToResult(readFilePromise(path));
}

// Example 5: Retry pattern with exponential backoff
async function fetchWithRetry(url: string): Promise<Result<any, Error>> {
  const fetchOperation = async (): Promise<Result<any, Error>> => {
    return await tryCatchAsync(async () => {
      // Simulate unreliable API
      const random = Math.random();

      // 70% chance of failure for demonstration
      if (random < 0.7) {
        throw new Error('Network request failed');
      }

      return {
        url,
        data: 'Fetched data',
        timestamp: new Date().toISOString(),
      };
    });
  };

  // Retry up to 5 times with exponential backoff starting at 1000ms
  return await retry(fetchOperation, { maxAttempts: 5, delayMs: 1000 });
}

// Example 6: Timeouts with Results
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Result<any, Error>> {
  return await tryCatchAsync(async () => {
    // Create a timeout promise that rejects after timeoutMs
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    // Create the actual fetch promise
    const fetchPromise = fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    });

    // Race the fetch against the timeout
    return await Promise.race([fetchPromise, timeoutPromise]);
  });
}

// Run and demonstrate the examples
async function runExamples(): Promise<void> {
  console.log('Example 1: Converting Promises to Results');

  const userResult = await fetchUserData('123');
  console.log('User found:', userResult.isSuccess);
  if (userResult.isSuccess) {
    console.log('User data:', userResult.value);
  }

  const nonExistentUserResult = await fetchUserData('999');
  console.log('Non-existent user found:', nonExistentUserResult.isSuccess);
  if (nonExistentUserResult.isFailure) {
    console.log('Error message:', nonExistentUserResult.error.message);
  }

  console.log('\nExample 2: Chaining async Results');

  const processedUserResult = await processUserData('123');
  console.log('Processing successful:', processedUserResult.isSuccess);
  if (processedUserResult.isSuccess) {
    console.log('Processed data:', processedUserResult.value);
  }

  console.log('\nExample 3: Parallel execution with Results');

  const multipleUsersResult = await fetchMultipleUsers(['123', '456']);
  console.log('Multiple users fetch successful:', multipleUsersResult.isSuccess);
  if (multipleUsersResult.isSuccess) {
    console.log('User count:', multipleUsersResult.value.length);
  } else {
    console.log('Error:', multipleUsersResult.error.message);
  }

  console.log('\nExample 4: Converting Promise-based APIs to Result-based');

  const fileResult = await readFileResult('exists.txt');
  console.log('File read successful:', fileResult.isSuccess);
  if (fileResult.isSuccess) {
    console.log('File content:', fileResult.value);
  }

  const missingFileResult = await readFileResult('missing.txt');
  console.log('Missing file read successful:', missingFileResult.isSuccess);
  if (missingFileResult.isFailure) {
    console.log('Error:', missingFileResult.error.message);
  }

  console.log('\nExample 5: Retry pattern with exponential backoff');

  const retryResult = await fetchWithRetry('https://api.example.com/data');
  console.log('Fetch with retry successful:', retryResult.isSuccess);
  if (retryResult.isSuccess) {
    console.log('Data:', retryResult.value);
  } else {
    console.log('Error after all retries:', retryResult.error.message);
  }

  console.log('\nExample 6: Timeouts with Results');

  try {
    // Mock implementation that doesn't actually make network requests
    const timeoutResult = await fetchWithTimeout('https://api.example.com/delayed', 500);
    console.log('Fetch with timeout successful:', timeoutResult.isSuccess);
    if (timeoutResult.isSuccess) {
      console.log('Data:', timeoutResult.value);
    } else {
      console.log('Error:', timeoutResult.error.message);
    }
  } catch (error) {
    console.log(
      'Error (expected in Node.js environment):',
      error instanceof Error ? error.message : String(error)
    );
    console.log('Note: This example is designed for browser environments with fetch API.');
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(error => console.error('Unhandled error:', error));
}

export {
  fetchUserData,
  processUserData,
  fetchMultipleUsers,
  promiseToResult,
  readFileResult,
  fetchWithRetry,
  fetchWithTimeout,
  runExamples,
};
