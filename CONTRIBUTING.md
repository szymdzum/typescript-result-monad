# Contributing to typescript-result-monad

Thank you for considering contributing to this project! This document outlines the setup, practices, and guidelines for contributing.

## Development Setup

### Prerequisites

- Node.js (v18 or newer)
- pnpm (v10 or newer)

### Setup Instructions

1. Install pnpm if you haven't already:
   ```shell
   npm install -g pnpm
   ```

2. Clone the repository:
   ```shell
   git clone https://github.com/szymdzum/typescript-result-monad.git
   cd typescript-result-monad
   ```

3. Install dependencies:
   ```shell
   pnpm install
   ```

### NPM Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the library
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage
- `pnpm format` - Format code with Biome
- `pnpm lint` - Lint code with Biome
- `pnpm lint:fix` - Fix linting issues
- `pnpm lint:all` - Format and lint code in one command
- `pnpm clean` - Clean the build directory

## Development Best Practices

### Code Style

We use [Biome](https://biomejs.dev/) for code formatting and linting. The configuration is in `biome.json`. VSCode integration is available via `.vscode/settings.json`.

### Testing

- Write tests for all new features
- Maintain high code coverage
- Run `pnpm test` before submitting a PR

### TypeScript

- Prefer strict typing over `any`
- Use descriptive interface and type names
- Maintain backward compatibility for public APIs

### Git Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if necessary
3. Add a description explaining your changes
4. Reference any related issues

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.