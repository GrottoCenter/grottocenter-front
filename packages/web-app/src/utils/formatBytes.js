// Human-readable byte formatter. Uses binary units (KiB thresholds) but keeps
// the traditional decimal-looking labels (KB/MB/GB) — this matches what most
// browsers and OSes surface to end users. A genuine 0-byte input renders as
// '0 B' so callers can distinguish it from an unknown/invalid size, which
// renders as an empty string.
const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];

const formatBytes = bytes => {
  if (bytes === 0) return '0 B';
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  const exponent = Math.min(
    UNITS.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024))
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${UNITS[exponent]}`;
};

export default formatBytes;
