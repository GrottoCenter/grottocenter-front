const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};
const escapeHtml = str => str.replace(/[&<>"']/g, c => HTML_ESCAPES[c]);

export const makeIconTooltip = (iconSrc, name) =>
  `<span style="display:flex;align-items:center;gap:6px"><img src="${escapeHtml(iconSrc ?? '')}" width="16" height="16">${escapeHtml(name ?? '—')}</span>`;
