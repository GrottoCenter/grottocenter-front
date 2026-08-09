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

// jsdom implements neither ResizeObserver nor IntersectionObserver, and the two
// share the same no-op surface here — so one factory covers both, returning a
// fresh class each time rather than a shared one, to keep `instanceof` honest.
//
// The no-ops have to be instance members to match the browser interface, so
// class-methods-use-this does not apply here.
/* eslint-disable class-methods-use-this */
const createNoopObserver = () =>
  class NoopObserver {
    observe() {}

    unobserve() {}

    disconnect() {}

    // Part of the IntersectionObserver interface: a caller may poll instead of
    // waiting for the callback, and undefined would throw where an array is
    // expected. Harmless on the ResizeObserver side, which never calls it.
    takeRecords() {
      return [];
    }
  };
/* eslint-enable class-methods-use-this */

// Used by useMeasuredHeight and the map components.
if (typeof window.ResizeObserver === 'undefined') {
  window.ResizeObserver = createNoopObserver();
}

// Used by PageTabs, FixedContent and the feedback button to know whether their
// header has scrolled out of view. Nothing intersects in jsdom, so the callback
// is never invoked and every such flag stays at its initial value — which is the
// "not scrolled" state the tests want anyway.
if (typeof window.IntersectionObserver === 'undefined') {
  window.IntersectionObserver = createNoopObserver();
}
