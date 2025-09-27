// Jest setup file for security tests

// Mock window object for browser APIs
Object.defineProperty(window, 'crypto', {
  value: {
    getRandomValues: jest.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    subtle: {
      importKey: jest.fn(),
      deriveBits: jest.fn(),
    },
  },
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});

// Mock DOMPurify for testing
global.DOMPurify = {
  sanitize: jest.fn((input: string) => input.replace(/<script[^>]*>.*?<\/script>/gi, '')),
  isValidNode: jest.fn(() => true),
};

// Mock setTimeout and setInterval for timer tests
jest.useFakeTimers();

// Setup global test utilities
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Console error suppression for expected test errors
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});