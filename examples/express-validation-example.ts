/**
 * Example of using the validation API with Express.js.
 *
 * This is a fully working Express application example demonstrating how
 * to use the validation API for RESTful API request validation.
 */
import { Result, ValidationError, validationIntegrations } from '../src/index.js';

/**
 * To run this example, uncomment the code below and install Express:
 * npm install express
 * npm install cors
 * npm install body-parser
 */

/**
 * Example Express.js application using Result monad validation
 *
 * Sample curl commands to test the API:
 *
 * Valid request:
 * curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"John Doe","email":"john@example.com","age":30,"roles":["user"]}'
 *
 * Invalid request:
 * curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" -d '{"name":"","email":"not-an-email","age":16,"roles":[]}'
 */
/*
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Create Express application
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// User model
interface User {
  id?: number;
  name: string;
  email: string;
  age: number;
  roles: string[];
}

// In-memory "database"
const users: User[] = [];
let nextId = 1;

// Validation middleware using our validation API
const validateUser = validationIntegrations.validateBody<User>(user =>
  user
    .property('name', name => name.notEmpty().maxLength(100))
    .property('email', email => email.notEmpty().email())
    .property('age', age => age.isNumber().min(18))
    .property('roles', roles => roles.custom(
      r => Array.isArray(r) && r.length > 0,
      'At least one role must be assigned'
    ))
);

// Routes
app.get('/api/users', (req, res) => {
  res.json({ users });
});

app.get('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);

  const userResult = findUser(userId);

  userResult.match(
    user => res.json({ user }),
    error => {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(404).json({ error: error.message });
      }
    }
  );
});

// Create new user with validation
app.post('/api/users', validateUser, (req, res) => {
  // The validator middleware ensures req.body contains valid user data
  const user: User = req.body;

  // Add user to database
  const createResult = createUser(user);

  createResult.match(
    createdUser => res.status(201).json({ user: createdUser, message: 'User created successfully' }),
    error => res.status(400).json({ error: error.message })
  );
});

// Update existing user with validation
app.put('/api/users/:id', validateUser, (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const userData: User = req.body;

  // Update user
  const updateResult = updateUser(userId, userData);

  updateResult.match(
    updatedUser => res.json({ user: updatedUser, message: 'User updated successfully' }),
    error => {
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(404).json({ error: error.message });
      }
    }
  );
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);

  const deleteResult = deleteUser(userId);

  deleteResult.match(
    () => res.json({ message: 'User deleted successfully' }),
    error => res.status(404).json({ error: error.message })
  );
});

// User service functions returning Result monad
function findUser(id: number): Result<User, Error> {
  const user = users.find(u => u.id === id);

  if (!user) {
    return Result.fail(new Error(`User with id ${id} not found`));
  }

  return Result.ok(user);
}

function createUser(userData: User): Result<User, Error> {
  const newUser: User = {
    ...userData,
    id: nextId++
  };

  users.push(newUser);
  return Result.ok(newUser);
}

function updateUser(id: number, userData: User): Result<User, Error> {
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return Result.fail(new Error(`User with id ${id} not found`));
  }

  const updatedUser: User = {
    ...userData,
    id
  };

  users[index] = updatedUser;
  return Result.ok(updatedUser);
}

function deleteUser(id: number): Result<void, Error> {
  const index = users.findIndex(u => u.id === id);

  if (index === -1) {
    return Result.fail(new Error(`User with id ${id} not found`));
  }

  users.splice(index, 1);
  return Result.ok(undefined);
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('To test the API, use the curl commands shown in the comments');
});
*/
