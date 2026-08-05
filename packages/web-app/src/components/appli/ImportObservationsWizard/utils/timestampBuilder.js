import { parse, format as formatDate, isValid as isValidDate } from 'date-fns';
import { UTCDate } from '@date-fns/utc';
import { toDateFnsFormat } from './momentToDateFnsFormat';

/**
 * Parses a date string with a moment-style format and interprets the result
 * as UTC (same semantics as moment.utc(value, format)).
 *
 * Uses strict round-trip validation: after parsing, the date is formatted back
 * with the same format and compared to the original input. This catches padding
 * mismatches (e.g. "1" rejected for "dd" format, "9" rejected for "HH").
 *
 * Implementation note: `UTCDate` from @date-fns/utc is used as the reference
 * date, ensuring all date-fns operations (parse and format) work in UTC
 * regardless of the host machine's timezone. This avoids DST-related failures
 * where a wall-clock time that doesn't exist in the host timezone (e.g. during
 * spring-forward) would cause the round-trip check to fail spuriously.
 *
 * @param {string} value - The date string to parse
 * @param {string} momentFormat - Format string using moment/dayjs tokens
 * @returns {Date|null} A Date representing the UTC instant, or null if invalid
 */
const parseUtc = (value, momentFormat) => {
  const dfFormat = toDateFnsFormat(momentFormat);
  // UTCDate ensures date-fns operates entirely in UTC, avoiding host-timezone
  // DST issues where local times can be non-existent or ambiguous.
  const parsed = parse(value, dfFormat, new UTCDate(0));
  if (!isValidDate(parsed) || Number.isNaN(parsed.getTime())) return null;
  // Strict: format back and compare to catch padding mismatches
  if (formatDate(parsed, dfFormat) !== value) return null;
  return parsed instanceof UTCDate
    ? new Date(parsed.getTime())
    : new Date(
        Date.UTC(
          parsed.getFullYear(),
          parsed.getMonth(),
          parsed.getDate(),
          parsed.getHours(),
          parsed.getMinutes(),
          parsed.getSeconds(),
          parsed.getMilliseconds()
        )
      );
};

/**
 * Converts a local date (naively representing a wall-clock time in the given
 * IANA timezone) to a UTC Date.
 *
 * Strategy: construct the wall-clock time as a UTC instant, then measure the
 * actual offset the timezone would apply at that instant via
 * Intl.DateTimeFormat, and compensate.  One iteration of compensation is
 * sufficient for the DST edge-cases that matter in practice.
 *
 * Known limitation: during DST "spring forward" transitions (e.g.
 * 2024-03-10 02:30 America/New_York does not exist as a wall-clock time),
 * this function may return an approximate result rather than null, because
 * only one iteration of offset compensation is performed. This is acceptable
 * for observation data where sub-hour accuracy near DST gaps is tolerable.
 *
 * @param {Date} localDate - A Date whose UTC fields encode the desired
 *   wall-clock time (i.e. year/month/day/hours/minutes/seconds are the local
 *   values, not UTC values).
 * @param {string} timezone - IANA timezone string (e.g. "Europe/Paris")
 * @returns {Date} UTC Date
 */
const zonedTimeToUtc = (localDate, timezone) => {
  // Build a date string that looks like the local wall-clock time
  const year = localDate.getUTCFullYear();
  const month = localDate.getUTCMonth();
  const day = localDate.getUTCDate();
  const hours = localDate.getUTCHours();
  const minutes = localDate.getUTCMinutes();
  const seconds = localDate.getUTCSeconds();
  const ms = localDate.getUTCMilliseconds();

  // Approximate: treat the wall-clock instant as UTC first
  const approxUtc = new Date(
    Date.UTC(year, month, day, hours, minutes, seconds, ms)
  );

  // Get the UTC offset (in minutes) that the timezone applies at that instant
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(approxUtc);
  const p = {};
  for (const { type, value } of parts) {
    p[type] = value;
  }

  // Reconstruct the local wall-clock time the timezone sees for approxUtc
  const tzYear = parseInt(p.year, 10);
  const tzMonth = parseInt(p.month, 10) - 1;
  const tzDay = parseInt(p.day, 10);
  // hour12: false gives "24" for midnight; normalise to 0
  const tzHour = parseInt(p.hour, 10) % 24;
  const tzMinute = parseInt(p.minute, 10);
  const tzSecond = parseInt(p.second, 10);

  const tzLocal = new Date(
    Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond, ms)
  );

  // offset = how much the timezone is ahead of UTC
  const offsetMs = tzLocal.getTime() - approxUtc.getTime();

  // Subtract the offset to get the true UTC instant
  return new Date(approxUtc.getTime() - offsetMs);
};

/**
 * Assembles a UTC ISO 8601 string from one or more timestamp columns in a
 * single CSV row.
 *
 * Assembly priority:
 *   1. `datetime` column  — parse with the configured dateFormat
 *   2. `date` + optional `time` columns  — combine strings, parse
 *   3. `year` + `month` + `day` + optional `hour`/`minute`/`second`
 *   4. `elapsed_seconds` columns  — add accumulated offset to the base date
 *      (if no base date was produced, returns null)
 *
 * @param {string[]} row - A single data row (1-D array indexed by columnIndex)
 * @param {Array<{
 *   columnIndex: number,
 *   role: string,
 *   timestampType: string,
 *   dateFormat: string|null,
 *   timeFormat: string|null,
 *   timezone: string|null
 * }>} mappings - All column mapping objects for the file
 * @param {string} timezone - IANA timezone string used when a mapping has no
 *   per-column timezone override
 * @returns {string|null} UTC ISO 8601 string, or null on any failure
 */
export const buildTimestamp = (row, mappings, timezone) => {
  try {
    const tsMappings = mappings.filter(m => m.role === 'timestamp');
    if (tsMappings.length === 0) return null;

    const tz = timezone || 'UTC';

    const byType = type => tsMappings.filter(m => m.timestampType === type);
    const firstByType = type => byType(type)[0];

    const getValue = mapping => {
      const val = row[mapping.columnIndex];
      if (val == null || String(val).trim() === '') return null;
      return String(val).trim();
    };

    let baseUtc = null;

    // ── Strategy 1: datetime column ─────────────────────────────────────────
    const datetimeMapping = firstByType('datetime');
    if (datetimeMapping) {
      const value = getValue(datetimeMapping);
      if (!value) return null;
      const fmt = datetimeMapping.dateFormat;
      if (!fmt) return null;
      const parsed = parseUtc(value, fmt);
      if (!parsed) return null;
      // parsed UTC fields represent the wall-clock time; convert to true UTC
      baseUtc = zonedTimeToUtc(parsed, datetimeMapping.timezone || tz);
      if (Number.isNaN(baseUtc.getTime())) return null;
    }

    // ── Strategy 2: dateOnly + optional timeOnly columns ──────────────────
    if (!baseUtc) {
      const dateMapping = firstByType('dateOnly');
      if (dateMapping) {
        const dateValue = getValue(dateMapping);
        if (!dateValue) return null;
        const dateFmt = dateMapping.dateFormat;
        if (!dateFmt) return null;

        const timeMapping = firstByType('timeOnly');
        let combined;

        if (timeMapping) {
          const timeValue = getValue(timeMapping);
          if (!timeValue) return null;
          const timeFmt = timeMapping.timeFormat;
          if (!timeFmt) return null;
          combined = parseUtc(
            `${dateValue} ${timeValue}`,
            `${dateFmt} ${timeFmt}`
          );
        } else {
          combined = parseUtc(dateValue, dateFmt);
        }

        if (!combined) return null;
        baseUtc = zonedTimeToUtc(combined, dateMapping.timezone || tz);
        if (Number.isNaN(baseUtc.getTime())) return null;
      }
    }

    // ── Strategy 3: year + month + day + optional hour/minute/second ────────
    if (!baseUtc) {
      const yearMapping = firstByType('year');
      const monthMapping = firstByType('month');
      const dayMapping = firstByType('day');

      if (yearMapping && monthMapping && dayMapping) {
        const yearVal = getValue(yearMapping);
        const monthVal = getValue(monthMapping);
        const dayVal = getValue(dayMapping);
        if (!yearVal || !monthVal || !dayVal) return null;

        const year = parseInt(yearVal, 10);
        const month = parseInt(monthVal, 10);
        const day = parseInt(dayVal, 10);
        if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day))
          return null;

        const hourMapping = firstByType('hour');
        const minuteMapping = firstByType('minute');
        const secondMapping = firstByType('second');

        const hour = hourMapping
          ? parseInt(getValue(hourMapping) || '0', 10)
          : 0;
        const minute = minuteMapping
          ? parseInt(getValue(minuteMapping) || '0', 10)
          : 0;
        const second = secondMapping
          ? parseInt(getValue(secondMapping) || '0', 10)
          : 0;

        if (Number.isNaN(hour) || Number.isNaN(minute) || Number.isNaN(second))
          return null;

        // Build a Date whose UTC fields represent the wall-clock time
        const localWallClock = new Date(
          Date.UTC(year, month - 1, day, hour, minute, second, 0)
        );
        if (Number.isNaN(localWallClock.getTime())) return null;

        const componentTz = yearMapping.timezone || tz;
        baseUtc = zonedTimeToUtc(localWallClock, componentTz);
        if (Number.isNaN(baseUtc.getTime())) return null;
      }
    }

    // ── Strategy 4: elapsed_seconds columns ──────────────────────────────────
    // When a base date exists, elapsed values are added as offsets.
    // When no base date exists, the value is treated as a Unix timestamp
    // (absolute seconds since epoch).
    const elapsedMappings = byType('elapsed_seconds');
    if (elapsedMappings.length > 0) {
      let totalElapsedMs = 0;
      for (const m of elapsedMappings) {
        const val = getValue(m);
        if (val == null) return null;
        const secs = parseFloat(val);
        if (!Number.isFinite(secs)) return null;
        totalElapsedMs += secs * 1000;
      }

      if (baseUtc) {
        baseUtc = new Date(baseUtc.getTime() + totalElapsedMs);
      } else {
        baseUtc = new Date(totalElapsedMs);
      }
    }

    if (!baseUtc) return null;

    // toISOString() always returns UTC in the format "YYYY-MM-DDTHH:mm:ss.sssZ"
    // which is a valid ISO 8601 UTC string (Z ≡ +00:00)
    return baseUtc.toISOString();
  } catch (_err) {
    return null;
  }
};
