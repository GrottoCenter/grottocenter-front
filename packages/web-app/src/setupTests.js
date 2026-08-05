// Extends Vitest's expect with @testing-library/jest-dom matchers.
// Allows assertions like: expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver, which is used by useMeasuredHeight
// and the map components. Provide a no-op polyfill for the test environment.
if (typeof window.ResizeObserver === 'undefined') {
  // The no-ops have to be instance members to match the browser interface,
  // so class-methods-use-this does not apply here.
  /* eslint-disable class-methods-use-this */
  window.ResizeObserver = class ResizeObserver {
    observe() {}

    unobserve() {}

    disconnect() {}
  };
  /* eslint-enable class-methods-use-this */
}
