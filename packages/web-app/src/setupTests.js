// Extends Vitest's expect with @testing-library/jest-dom matchers.
// Allows assertions like: expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';

// jsdom does not implement window.matchMedia, and MUI's useMediaQuery relies
// on it. Without a polyfill every breakpoint check falls back to `false`, which
// silently flips the whole app into mobile mode inside tests. Assume a very
// wide desktop viewport: a `min-width` bound matches, a `max-width` bound
// doesn't, and a compound query needs the max-width side to fail — hence the
// explicit AND, not just "has min-width".
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = query => ({
    matches: /min-width/.test(query) && !/max-width/.test(query),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

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
