import { isMobile } from 'react-device-detect';

/**
 * Whether the browser can render a PDF from `<object>` / `<embed>` / `<iframe>`.
 *
 * Those tags render nothing on their own — they hand the file to a native PDF
 * plugin. Chrome on Android has none, and neither does the WebView an installed
 * PWA or a TWA runs in, so the tag silently collapses to its fallback content
 * and the only way left to read the file is to download it.
 * `navigator.pdfViewerEnabled` is exactly that capability question (Chrome 94+,
 * Firefox 90+, Safari 16.4+).
 *
 * `isMobile` is an additional veto rather than a redundant one: iOS Safari
 * answers `true` here and does display a PDF in an embed, but only its first
 * page, with no way to scroll to the second. react-device-detect's `isMobile`
 * covers tablets too, which behave the same way.
 *
 * Engines too old to expose the property answer `false` and get the PDF.js
 * viewer. Probing the legacy `navigator.mimeTypes` registry instead would be a
 * worse trade: it reports the plugin, not whether the engine will actually
 * display the file inline, and it is exactly the browsers where that gap shows.
 */
export const hasNativePdfViewer = () => {
  if (typeof navigator === 'undefined' || isMobile) return false;
  if (typeof navigator.pdfViewerEnabled === 'boolean')
    return navigator.pdfViewerEnabled;
  return false;
};
