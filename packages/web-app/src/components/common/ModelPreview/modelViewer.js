// Keep the 3D engine in a named lazy chunk. The service worker excludes this
// chunk from installation and caches it only when a visitor opens a model.
export { ModelViewerElement } from '@google/model-viewer';
