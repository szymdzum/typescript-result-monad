// Add cause property to Error interface for TypeScript
declare global {
  interface Error {
    cause?: unknown;
  }
}

export {};
