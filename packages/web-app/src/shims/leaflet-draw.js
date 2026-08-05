// Shim for `leaflet-draw`.
//
// `leaflet-draw` ships a pure side-effect IIFE (dist/leaflet.draw.js) that
// augments the global Leaflet `L` object and exposes nothing via
// module.exports. `react-leaflet-draw` does `import Draw from 'leaflet-draw'`
// (the `Draw` binding is unused — it is only imported for the side effect),
// which Rolldown rejects at build time because there is no default export.
//
// This shim runs the side effect and re-exports `L.Draw` as the default so the
// import resolves cleanly. It is wired in via a `resolve.alias` in
// vite.config.mjs.
import L from 'leaflet';
// Deep import into the package dist: the extension is what makes it resolve
// to the bundled IIFE, so import/extensions cannot apply here.
// eslint-disable-next-line import/extensions
import 'leaflet-draw/dist/leaflet.draw.js';

export default L.Draw;
