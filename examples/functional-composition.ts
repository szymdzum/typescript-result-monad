import { Result } from '../src';

/**
 * This file demonstrates functional composition patterns using the Result monad.
 * It shows how to chain operations in a functional style while maintaining type safety
 * and proper error handling.
 */

// Example 1: Data transformation pipeline
interface RawData {
  id: string;
  values: string[];
  metadata?: {
    created: string;
    modified?: string;
  };
}

interface ProcessedData {
  identifier: number;
  count: number;
  items: number[];
  createdDate: Date;
}

// Step 1: Parse the ID into a number
function parseId(data: RawData): Result<{ rawData: RawData; id: number }, Error> {
  const idNum = parseInt(data.id, 10);

  if (isNaN(idNum)) {
    return Result.fail(new Error(`Invalid ID format: ${data.id}`));
  }

  return Result.ok({ rawData: data, id: idNum });
}

// Step 2: Parse string values into numbers
function parseValues(data: { rawData: RawData; id: number }): Result<{ rawData: RawData; id: number; values: number[] }, Error> {
  try {
    const values = data.rawData.values.map(val => {
      const num = parseFloat(val);
      if (isNaN(num)) {
        throw new Error(`Invalid value: ${val}`);
      }
      return num;
    });

    return Result.ok({ ...data, values });
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error(String(error)));
  }
}

// Step 3: Parse dates from the metadata
function parseDates(data: { rawData: RawData; id: number; values: number[] }): Result<{
  id: number;
  values: number[];
  createdDate: Date;
  modifiedDate?: Date
}, Error> {
  if (!data.rawData.metadata?.created) {
    return Result.fail(new Error('Missing creation date in metadata'));
  }

  try {
    const createdDate = new Date(data.rawData.metadata.created);

    if (isNaN(createdDate.getTime())) {
      return Result.fail(new Error(`Invalid creation date: ${data.rawData.metadata.created}`));
    }

    let modifiedDate: Date | undefined = undefined;

    if (data.rawData.metadata.modified) {
      modifiedDate = new Date(data.rawData.metadata.modified);

      if (isNaN(modifiedDate.getTime())) {
        return Result.fail(new Error(`Invalid modification date: ${data.rawData.metadata.modified}`));
      }
    }

    return Result.ok({
      id: data.id,
      values: data.values,
      createdDate,
      modifiedDate
    });
  } catch (error) {
    return Result.fail(error instanceof Error ? error : new Error(String(error)));
  }
}

// Step 4: Create the final processed data
function createProcessedData(data: {
  id: number;
  values: number[];
  createdDate: Date;
  modifiedDate?: Date
}): Result<ProcessedData, Error> {
  return Result.ok({
    identifier: data.id,
    count: data.values.length,
    items: data.values,
    createdDate: data.createdDate
  });
}

// Complete pipeline combining all steps
function processData(rawData: RawData): Result<ProcessedData, Error> {
  return parseId(rawData)
    .flatMap(parseValues)
    .flatMap(parseDates)
    .flatMap(createProcessedData);
}

// Example 2: Validation pipeline with early return
interface UserInput {
  username?: string;
  email?: string;
  password?: string;
  age?: number;
}

interface ValidatedUser {
  username: string;
  email: string;
  password: string;
  age: number;
}

// Use multiple validation functions and combine their results
function validateUserInput(input: UserInput): Result<ValidatedUser, Error> {
  const usernameResult = validateUsername(input.username);
  const emailResult = validateEmail(input.email);
  const passwordResult = validatePassword(input.password);
  const ageResult = validateAge(input.age);

  // If any validation fails, return the first error
  if (usernameResult.isFailure) return Result.fail<ValidatedUser, Error>(usernameResult.error);
  if (emailResult.isFailure) return Result.fail<ValidatedUser, Error>(emailResult.error);
  if (passwordResult.isFailure) return Result.fail<ValidatedUser, Error>(passwordResult.error);
  if (ageResult.isFailure) return Result.fail<ValidatedUser, Error>(ageResult.error);

  // All validations passed, return the validated user
  return Result.ok<ValidatedUser, Error>({
    username: usernameResult.value,
    email: emailResult.value,
    password: passwordResult.value,
    age: ageResult.value
  });
}

function validateUsername(username?: string): Result<string, Error> {
  if (!username) {
    return Result.fail(new Error('Username is required'));
  }

  if (username.length < 3) {
    return Result.fail(new Error('Username must be at least 3 characters long'));
  }

  return Result.ok(username);
}

function validateEmail(email?: string): Result<string, Error> {
  if (!email) {
    return Result.fail(new Error('Email is required'));
  }

  if (!email.includes('@') || !email.includes('.')) {
    return Result.fail(new Error('Invalid email format'));
  }

  return Result.ok(email);
}

function validatePassword(password?: string): Result<string, Error> {
  if (!password) {
    return Result.fail(new Error('Password is required'));
  }

  if (password.length < 8) {
    return Result.fail(new Error('Password must be at least 8 characters long'));
  }

  return Result.ok(password);
}

function validateAge(age?: number): Result<number, Error> {
  if (age === undefined) {
    return Result.fail(new Error('Age is required'));
  }

  if (age < 18) {
    return Result.fail(new Error('Must be at least 18 years old'));
  }

  return Result.ok(age);
}

// Example 3: Advanced function composition with shared context
interface AppContext {
  userId: string;
  authToken: string;
  timestamp: Date;
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
}

// Function that creates another function to process requests within a context
function withContext(context: AppContext) {
  // Returns a function that takes a todo ID and returns a Result
  return function getTodoItem(todoId: string): Result<TodoItem, Error> {
    // Validate context first
    if (!context.userId) {
      return Result.fail(new Error('Missing user ID in context'));
    }

    if (!context.authToken) {
      return Result.fail(new Error('Missing auth token in context'));
    }

    console.log(`[${context.timestamp.toISOString()}] User ${context.userId} requested todo ${todoId}`);

    // Simulate API call to get a todo item
    if (todoId === '1') {
      return Result.ok({
        id: '1',
        title: 'Learn functional programming',
        completed: false
      });
    }

    return Result.fail(new Error(`Todo item not found: ${todoId}`));
  };
}

// Example 4: Combining multiple Results
function combineResultsExample(): void {
  const result1 = Result.ok<number, Error>(1);
  const result2 = Result.ok<number, Error>(2);
  const result3 = Result.ok<number, Error>(3);

  // Combine multiple results into a single Result<number[], Error>
  const combinedResults = combineResults([result1, result2, result3]);

  if (combinedResults.isSuccess) {
    console.log('All results succeeded:', combinedResults.value);

    // We can continue processing with the combined results
    const sum = combinedResults.value.reduce((acc, val) => acc + val, 0);
    console.log('Sum of values:', sum);
  } else {
    console.error('One or more results failed:', combinedResults.error);
  }

  // Example with one failure
  const failedResult = Result.fail<number, Error>(new Error('Something went wrong'));
  const mixedResults = combineResults([result1, failedResult, result3]);

  if (mixedResults.isSuccess) {
    console.log('All results succeeded:', mixedResults.value);
  } else {
    console.error('One or more results failed:', mixedResults.error);
  }
}

// Helper function to combine multiple Results into one
function combineResults<T>(results: Result<T, Error>[]): Result<T[], Error> {
  const values: T[] = [];

  for (const result of results) {
    if (result.isFailure) {
      return Result.fail(result.error);
    }
    values.push(result.value);
  }

  return Result.ok(values);
}

// Run the examples
function runExamples(): void {
  console.log('Example 1: Data Transformation Pipeline');

  const validRawData: RawData = {
    id: '123',
    values: ['1.5', '2.5', '3.5'],
    metadata: {
      created: '2023-05-15T10:30:00Z'
    }
  };

  const invalidRawData: RawData = {
    id: 'abc', // Invalid ID
    values: ['1.5', 'not-a-number', '3.5'],
    metadata: {
      created: 'invalid-date'
    }
  };

  const validResult = processData(validRawData);
  const invalidResult = processData(invalidRawData);

  console.log('Valid data result:', validResult.isSuccess ? 'Success' : 'Failure');
  if (validResult.isSuccess) {
    console.log('Processed data:', validResult.value);
  } else {
    console.error('Error:', validResult.error.message);
  }

  console.log('Invalid data result:', invalidResult.isSuccess ? 'Success' : 'Failure');
  if (invalidResult.isFailure) {
    console.error('Error:', invalidResult.error.message);
  }

  console.log('\nExample 2: Validation Pipeline');

  const validUserInput: UserInput = {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    age: 25
  };

  const invalidUserInput: UserInput = {
    username: 'jo', // Too short
    email: 'not-an-email',
    password: 'short',
    age: 16 // Too young
  };

  const validUserResult = validateUserInput(validUserInput);
  const invalidUserResult = validateUserInput(invalidUserInput);

  console.log('Valid user result:', validUserResult.isSuccess ? 'Success' : 'Failure');
  if (validUserResult.isSuccess) {
    console.log('Validated user:', validUserResult.value);
  } else {
    console.error('Error:', validUserResult.error.message);
  }

  console.log('Invalid user result:', invalidUserResult.isSuccess ? 'Success' : 'Failure');
  if (invalidUserResult.isFailure) {
    console.error('Error:', invalidUserResult.error.message);
  }

  console.log('\nExample 3: Function Composition with Context');

  const context: AppContext = {
    userId: 'user-123',
    authToken: 'auth-token-456',
    timestamp: new Date()
  };

  const getTodo = withContext(context);

  const existingTodoResult = getTodo('1');
  const nonExistingTodoResult = getTodo('999');

  console.log('Existing todo result:', existingTodoResult.isSuccess ? 'Success' : 'Failure');
  if (existingTodoResult.isSuccess) {
    console.log('Todo item:', existingTodoResult.value);
  } else {
    console.error('Error:', existingTodoResult.error.message);
  }

  console.log('Non-existing todo result:', nonExistingTodoResult.isSuccess ? 'Success' : 'Failure');
  if (nonExistingTodoResult.isFailure) {
    console.error('Error:', nonExistingTodoResult.error.message);
  }

  console.log('\nExample 4: Combining Multiple Results');
  combineResultsExample();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

export {
  processData,
  validateUserInput,
  withContext,
  combineResults,
  runExamples
};