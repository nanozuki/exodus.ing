import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// vitest-setup-client.ts registers the jest-dom matchers and replaces `window.matchMedia` with a writable `vi.fn` stub
// whose queries never match. Importing it requires a window and Vitest.

// jsdom has no matchMedia implementation; tests must provide this browser capability.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  enumerable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
