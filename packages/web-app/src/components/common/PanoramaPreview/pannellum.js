import 'pannellum/build/pannellum';
import 'pannellum/build/pannellum.css';

// Pannellum's browser bundle registers its API on window rather than exporting it.
export const createPanoramaViewer = (container, options) =>
  window.pannellum.viewer(container, options);
