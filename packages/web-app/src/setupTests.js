// Extends Vitest's expect with @testing-library/jest-dom matchers.
// Allows assertions like: expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver, which is used by useMeasuredHeight
// and the map components. Provide a no-op polyfill for the test environment.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
}
