/**
 * Examples of using the validation API with the Result monad.
 */
import {
  Result,
  ValidationError,
  Validator,
  validate,
  validationIntegrations,
} from '../src/index.js';

// Basic user interface for validation examples
interface User {
  id?: number;
  name: string;
  email: string;
  age: number;
  roles: string[];
  profile?: {
    bio: string;
    website?: string;
  };
}

/**
 * Example 1: Basic validation with property validators
 */
function basicValidationExample() {
  console.log('=== Basic Validation Example ===');

  // Valid user
  const validUser: User = {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    roles: ['user'],
    profile: {
      bio: 'Software developer',
      website: 'https://example.com',
    },
  };

  // Invalid user
  const invalidUser: User = {
    name: '',
    email: 'not-an-email',
    age: 17,
    roles: [],
  } as User;

  // Create a validator for user objects
  const validateUser = (user: User) => {
    return validate(user)
      .property('name', name => name.notEmpty().maxLength(100))
      .property('email', email => email.notEmpty().email())
      .property('age', age => age.isNumber().min(18))
      .property('roles', roles =>
        roles.custom(r => r.length > 0, 'At least one role must be assigned')
      )
      .validate();
  };

  // Validate the valid user
  const validResult = validateUser(validUser);
  console.log('Valid user result:', validResult.isSuccess);

  // Validate the invalid user
  const invalidResult = validateUser(invalidUser);
  if (invalidResult.isFailure) {
    console.log('Invalid user errors:', invalidResult.error.message);
  }

  // Using pattern matching with validation results
  const validationMessage = invalidResult.match(
    user => `User ${user.name} is valid`,
    error => `Validation failed: ${error.message}`
  );
  console.log(validationMessage);

  console.log();
}

/**
 * Example 2: Nested object validation
 */
function nestedValidationExample() {
  console.log('=== Nested Object Validation Example ===');

  const user: User = {
    name: 'Jane Smith',
    email: 'jane@example.com',
    age: 25,
    roles: ['admin'],
    profile: {
      bio: '', // Invalid: bio is empty
      website: 'invalid-website', // Invalid: not a URL
    },
  };

  // Validate with nested fields
  const result = validate(user)
    .property('name', name => name.notEmpty())
    .property('email', email => email.email())
    .nested('profile', profile =>
      (profile as Validator<{ bio: string; website?: string }>)
        .required()
        .property('bio', bio => bio.notEmpty())
    )
    .validate();

  console.log('Is valid:', result.isSuccess);
  if (result.isFailure) {
    console.log('Validation errors:', result.error.message);
  }

  // Chain validations with Result's flatMap
  const processUser = (user: User): Result<string, ValidationError> => {
    return validate(user)
      .property('name', name => name.notEmpty())
      .property('email', email => email.email())
      .validate()
      .flatMap(validUser => {
        // Process the valid user
        return Result.ok(`User ${validUser.name} processed successfully`);
      });
  };

  const processResult = processUser(user);
  console.log(
    'Process result:',
    processResult.isSuccess ? processResult.value : processResult.error.message
  );

  console.log();
}

/**
 * Example 3: Array validation
 */
function arrayValidationExample() {
  console.log('=== Array Validation Example ===');

  const team = {
    name: 'Development Team',
    members: [
      { name: 'Alice', email: 'alice@example.com', skills: ['JavaScript', 'React'] },
      { name: 'Bob', email: 'not-an-email', skills: [] }, // Invalid email and empty skills
      { name: '', email: 'charlie@example.com', skills: ['TypeScript'] }, // Empty name
    ],
  };

  // Commented code here...

  console.log();
}

/**
 * Example 4: Custom validation with predicates
 */
function customValidationExample() {
  console.log('=== Custom Validation Example ===');

  interface Payment {
    amount: number;
    currency: string;
    paymentMethod: string;
    cardNumber?: string;
  }

  const payment: Payment = {
    amount: 100,
    currency: 'USD',
    paymentMethod: 'credit_card',
    cardNumber: '4111111111111111',
  };

  // Custom credit card validation
  const isCreditCard = (value: string): boolean => {
    // Simple Luhn algorithm check (simplified for example)
    if (!/^\d{13,19}$/.test(value)) return false;

    let sum = 0;
    let double = false;

    for (let i = value.length - 1; i >= 0; i--) {
      let digit = parseInt(value.charAt(i), 10);

      if (double) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      double = !double;
    }

    return sum % 10 === 0;
  };

  const result = validate(payment)
    .property('amount', amount =>
      amount.isNumber().custom(amt => amt > 0, 'Amount must be positive')
    )
    .property('currency', currency => currency.oneOf(['USD', 'EUR', 'GBP']))
    .property('paymentMethod', method => method.notEmpty())
    .custom(
      p => p.paymentMethod !== 'credit_card' || (!!p.cardNumber && isCreditCard(p.cardNumber)),
      'Valid card number is required for credit card payments'
    )
    .validate();

  console.log('Is payment valid:', result.isSuccess);
  if (result.isFailure) {
    console.log('Payment validation errors:', result.error.message);
  }

  console.log();
}

/**
 * Example 5: Framework integration (Express.js)
 */
function expressIntegrationExample() {
  console.log('=== Express.js Integration Example ===');

  // Simulated Express request, response and next objects
  const req = { body: { username: 'johndoe', password: 'short' } };
  const res = {
    status: (code: number) => ({
      json: (data: any) => console.log(`Response (${code}):`, data),
    }),
  };
  const next = () => console.log('Validation passed, proceeding to route handler');

  // Create a validator middleware
  const validateLogin = validationIntegrations.validateBody<{ username: string; password: string }>(
    body =>
      body
        .property('username', username => username.notEmpty())
        .property('password', password =>
          password
            .notEmpty()
            .minLength(8)
            .withMessage('Password must be at least 8 characters long')
        )
  );

  // Simulate middleware execution
  console.log('Validating request:', req.body);
  validateLogin(req, res, next);

  console.log();
}

/**
 * Example 6: Framework integration (React Hook Form)
 */
function reactHookFormExample() {
  console.log('=== React Hook Form Integration Example ===');

  // Create a validation resolver for React Hook Form
  const validationResolver = validationIntegrations.createHookFormResolver<User>(user =>
    user
      .property('name', name => name.notEmpty())
      .property('email', email => email.email())
      .property('age', age => age.isNumber().min(18))
  );

  // Simulate form data
  const formData = {
    name: '',
    email: 'invalid',
    age: 16,
    roles: [],
  } as User;

  // Simulate validation in resolver
  const resolverResult = validationResolver(formData);
  console.log('Form validation result:', JSON.stringify(resolverResult, null, 2));

  console.log();
}

// Run all examples
basicValidationExample();
nestedValidationExample();
arrayValidationExample();
customValidationExample();
expressIntegrationExample();
reactHookFormExample();
