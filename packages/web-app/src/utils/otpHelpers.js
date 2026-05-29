export const normalizeOtp = raw =>
  raw
    .replace(/[\s-]/g, '')
    .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, '')
    .slice(0, 6);
