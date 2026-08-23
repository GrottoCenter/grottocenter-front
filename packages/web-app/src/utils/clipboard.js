/**
 * Copies the given text to the clipboard.
 * Uses the modern Clipboard API when available, with a textarea execCommand fallback
 * for older browsers.
 * @param {string} text
 * @returns {Promise<void>}
 */
const copyToClipboard = async text => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const el = Object.assign(document.createElement('textarea'), {
      value: text
    });
    el.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(el);
    el.select();
    // execCommand is deprecated but remains the only cross-browser clipboard fallback
    document.execCommand('copy');
    el.remove();
  }
};

export default copyToClipboard;
