// leaflet-rotate patches a *global* `L` at import time (its `src` entry
// references `L` without importing it). Leaflet's UMD build already exposes
// `window.L`, but stricter bundlers (e.g. Vite/Rollup, used on the migration
// branch) may not guarantee it — so we set it explicitly BEFORE importing the
// plugin. This module must be imported before `leaflet-rotate`.
import * as L from 'leaflet';

if (typeof window !== 'undefined' && !window.L) {
  window.L = L;
}

// Leaflet's Draggable decorates the current mousemove target while dragging.
// Firefox can report `document` or `window` as that target when the pointer
// leaves an element. Those EventTargets have no `className`, so Leaflet's
// DomUtil.getClass throws before the drag can finish. Ignore only these
// non-element targets; normal HTMLElement and SVGElement handling is unchanged.
const DOM_CLASS_GUARD = Symbol.for('grottocenter.leafletDomClassGuard');

const guardDomClassUtility = utility => {
  if (utility[DOM_CLASS_GUARD]) return utility;

  const guardedUtility = (element, ...args) => {
    if (!element?.classList && element?.className === undefined) return;
    utility(element, ...args);
  };
  guardedUtility[DOM_CLASS_GUARD] = true;
  return guardedUtility;
};

L.DomUtil.addClass = guardDomClassUtility(L.DomUtil.addClass);
L.DomUtil.removeClass = guardDomClassUtility(L.DomUtil.removeClass);
