import { parse, isValid } from 'date-fns';
import { COLUMN_ROLES } from './constants';

/**
 * Get all timestamp columns from the mappings, sorted by column index.
 */
const getTimestampColumns = columnMappings =>
  Object.entries(columnMappings)
    .filter(([_, m]) => m.role === COLUMN_ROLES.TIMESTAMP && m.timestampType)
    .map(([idx, m]) => ({ index: Number(idx), timestampType: m.timestampType }))
    .sort((a, b) => a.index - b.index);

/**
 * Get the UTC offset in milliseconds for a given IANA timezone at a specific instant.
 */
const getTimezoneOffsetMs = (utcMs, timezone) => {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = fmt.formatToParts(new Date(utcMs));
    const get = type => parseInt(parts.find(p => p.type === type).value, 10);

    const tzYear = get('year');
    const tzMonth = get('month');
    const tzDay = get('day');
    const tzHour = get('hour') === 24 ? 0 : get('hour');
    const tzMinute = get('minute');
    const tzSecond = get('second');

    const localAsUtcMs = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond);
    return localAsUtcMs - utcMs;
  } catch (e) {
    return null;
  }
};

/**
 * Apply timezone correction to a base timestamp (in ms).
 * Subtracts the source timezone offset to normalize to UTC.
 */
const applyTimezoneCorrection = (baseMs, timezone) => {
  if (!timezone || timezone === 'UTC') return baseMs;
  const offsetMs = getTimezoneOffsetMs(baseMs, timezone);
  if (offsetMs != null) return baseMs - offsetMs;
  return baseMs;
};

/**
 * Build a UTC ISO timestamp string from a data row.
 *
 * @param {Array} row - A single data row (array of strings)
 * @param {object} columnMappings - Column mappings keyed by column index
 * @param {object} options - Format options
 * @param {string} options.dateFormat - date-fns format for 'datetime' columns
 * @param {string} options.dateOnlyFormat - date-fns format for 'date' columns
 * @param {string} options.timeOnlyFormat - date-fns format for 'time' columns
 * @param {string} options.timezone - IANA timezone the source data is in
 * @returns {string|null} - Formatted UTC timestamp string or null if invalid
 */
export const buildTimestamp = (row, columnMappings, options) => {
  const { dateFormat, dateOnlyFormat, timeOnlyFormat, timezone } = options;

  const tsCols = getTimestampColumns(columnMappings);
  if (tsCols.length === 0) return null;

  const colsOfType = type => tsCols.filter(c => c.timestampType === type);
  const findCol = type => tsCols.find(c => c.timestampType === type);

  // Step 1: Determine the base timestamp (in ms since epoch)
  let baseMs = 0;
  let hasBase = false;

  // Priority 1: Full datetime column
  const datetimeCol = findCol('datetime');
  if (datetimeCol) {
    const rawTs = row[datetimeCol.index];
    if (!rawTs || !rawTs.trim()) return null;
    const parsed = parse(rawTs.trim(), dateFormat, new Date());
    if (!isValid(parsed)) return null;
    baseMs = Date.UTC(
      parsed.getFullYear(), parsed.getMonth(), parsed.getDate(),
      parsed.getHours(), parsed.getMinutes(), parsed.getSeconds(),
      parsed.getMilliseconds()
    );
    hasBase = true;
  }

  // Priority 2: Separate date + time columns
  if (!hasBase) {
    const dateCol = findCol('date');
    const timeCol = findCol('time');

    if (dateCol) {
      const rawDate = row[dateCol.index];
      if (!rawDate || !rawDate.trim()) return null;
      const parsedDate = parse(rawDate.trim(), dateOnlyFormat, new Date());
      if (!isValid(parsedDate)) return null;

      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      let millis = 0;

      if (timeCol) {
        const rawTime = row[timeCol.index];
        if (rawTime && rawTime.trim()) {
          const parsedTime = parse(rawTime.trim(), timeOnlyFormat, new Date());
          if (isValid(parsedTime)) {
            hours = parsedTime.getHours();
            minutes = parsedTime.getMinutes();
            seconds = parsedTime.getSeconds();
            millis = parsedTime.getMilliseconds();
          }
        }
      }

      baseMs = Date.UTC(
        parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(),
        hours, minutes, seconds, millis
      );
      hasBase = true;
    }
  }

  // Priority 3: Split year/month/day/hour/minute/second columns
  if (!hasBase) {
    const yearCol = findCol('year');
    const monthCol = findCol('month');
    const dayCol = findCol('day');
    const hourCol = findCol('hour');
    const minuteCol = findCol('minute');
    const secondCol = findCol('second');

    if (yearCol && monthCol && dayCol) {
      const year = parseInt(row[yearCol.index], 10);
      const month = parseInt(row[monthCol.index], 10);
      const day = parseInt(row[dayCol.index], 10);
      const hour = hourCol ? parseInt(row[hourCol.index], 10) : 0;
      const minute = minuteCol ? parseInt(row[minuteCol.index], 10) : 0;
      const second = secondCol ? parseInt(row[secondCol.index], 10) : 0;

      if ([year, month, day, hour, minute, second].some(v => Number.isNaN(v))) {
        return null;
      }

      baseMs = Date.UTC(year, month - 1, day, hour, minute, second);
      hasBase = true;
    }
  }

  // Apply timezone correction to the base (if we have one)
  if (hasBase) {
    baseMs = applyTimezoneCorrection(baseMs, timezone);
  }

  // Step 2: Apply all elapsed_seconds columns in order (they stack)
  const elapsedCols = colsOfType('elapsed_seconds');
  for (let i = 0; i < elapsedCols.length; i += 1) {
    const rawVal = row[elapsedCols[i].index];
    const seconds = parseFloat(rawVal);
    if (!Number.isFinite(seconds)) return null;
    baseMs += seconds * 1000;
  }

  // If we have no base and no elapsed_seconds, fail
  if (!hasBase && elapsedCols.length === 0) return null;

  const result = new Date(baseMs);
  if (!isValid(result)) return null;

  return result.toISOString().replace('T', ' ').replace('Z', '+00');
};

/**
 * Check if the current timestamp column assignments are sufficient.
 */
export const hasValidTimestampConfig = columnMappings => {
  const tsCols = getTimestampColumns(columnMappings);
  if (tsCols.length === 0) return false;

  const types = tsCols.map(c => c.timestampType);

  if (types.includes('datetime')) return true;
  if (types.includes('date')) return true;
  if (types.includes('elapsed_seconds')) return true;
  return types.includes('year') && types.includes('month') && types.includes('day');
};
