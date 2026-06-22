import { parse } from 'date-fns';
import { toDateFnsFormat } from './momentToDateFnsFormat';
import { buildTimestamp } from './timestampBuilder';

// Helper: build a mapping array with a single timestamp column
const makeMapping = (columnIndex, timestampType, extras = {}) => [
  {
    columnIndex,
    role: 'timestamp',
    timestampType,
    dateFormat: null,
    timeFormat: null,
    timezone: null,
    ...extras
  }
];

// Helper: assert result is a valid ISO UTC string
const expectValidIsoUtc = result => {
  expect(result).not.toBeNull();
  expect(typeof result).toBe('string');
  // toISOString() format: YYYY-MM-DDTHH:mm:ss.sssZ
  expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
};

// Helper: derive what UTC ms value buildTimestamp should produce for a given
// wall-clock string + timezone by computing the offset that Intl.DateTimeFormat
// would apply — mirrors the zonedTimeToUtc logic inside timestampBuilder.
// Uses moment-style format tokens (same convention as the production code).
const computeExpectedUtcMs = (wallClockStr, momentFmt, timezone) => {
  // Parse string using date-fns (interprets as local), then reinterpret as UTC
  const dfFmt = toDateFnsFormat(momentFmt);
  const local = parse(wallClockStr, dfFmt, new Date(0));
  const approxUtc = new Date(
    Date.UTC(
      local.getFullYear(),
      local.getMonth(),
      local.getDate(),
      local.getHours(),
      local.getMinutes(),
      local.getSeconds(),
      local.getMilliseconds()
    )
  );

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
  const tzYear = parseInt(p.year, 10);
  const tzMonth = parseInt(p.month, 10) - 1;
  const tzDay = parseInt(p.day, 10);
  const tzHour = parseInt(p.hour, 10) % 24;
  const tzMinute = parseInt(p.minute, 10);
  const tzSecond = parseInt(p.second, 10);

  const ms = approxUtc.getUTCMilliseconds();
  const tzLocal = new Date(
    Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute, tzSecond, ms)
  );
  const offsetMs = tzLocal.getTime() - approxUtc.getTime();
  return approxUtc.getTime() - offsetMs;
};

describe('buildTimestamp', () => {
  // ─── Strategy 1: datetime column ─────────────────────────────────────────

  describe('datetime column', () => {
    it('produces a valid UTC ISO string from a datetime value', () => {
      const row = ['2024-01-15 10:30:00'];
      const mappings = makeMapping(0, 'datetime', {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timezone: 'UTC'
      });
      const result = buildTimestamp(row, mappings, 'UTC');
      expectValidIsoUtc(result);
    });

    it('correctly encodes the date in UTC when timezone is UTC', () => {
      const wallClock = '2024-01-15 10:30:00';
      const fmt = 'YYYY-MM-DD HH:mm:ss';
      const tz = 'UTC';
      const row = [wallClock];
      const mappings = makeMapping(0, 'datetime', {
        dateFormat: fmt,
        timezone: tz
      });
      const result = buildTimestamp(row, mappings, tz);
      expectValidIsoUtc(result);
      const expectedMs = computeExpectedUtcMs(wallClock, fmt, tz);
      expect(new Date(result).getTime()).toBe(expectedMs);
    });

    it('returns null when the cell value is empty', () => {
      const row = [''];
      const mappings = makeMapping(0, 'datetime', {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timezone: 'UTC'
      });
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });

    it('returns null when dateFormat is missing', () => {
      const row = ['2024-01-15 10:30:00'];
      const mappings = makeMapping(0, 'datetime', {
        dateFormat: null,
        timezone: 'UTC'
      });
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });
  });

  // ─── Strategy 2: date + time columns ──────────────────────────────────────

  describe('date + time columns', () => {
    it('combines date and time columns into a correct UTC string', () => {
      const dateStr = '2024-03-20';
      const timeStr = '08:15:00';
      const dateFmt = 'YYYY-MM-DD';
      const timeFmt = 'HH:mm:ss';
      const tz = 'UTC';
      const row = [dateStr, timeStr];
      const mappings = [
        {
          columnIndex: 0,
          role: 'timestamp',
          timestampType: 'dateOnly',
          dateFormat: dateFmt,
          timeFormat: null,
          timezone: tz
        },
        {
          columnIndex: 1,
          role: 'timestamp',
          timestampType: 'timeOnly',
          dateFormat: null,
          timeFormat: timeFmt,
          timezone: tz
        }
      ];
      const result = buildTimestamp(row, mappings, tz);
      expectValidIsoUtc(result);
      // Expected: the same UTC ms as parsing the combined string
      const expectedMs = computeExpectedUtcMs(
        `${dateStr} ${timeStr}`,
        `${dateFmt} ${timeFmt}`,
        tz
      );
      expect(new Date(result).getTime()).toBe(expectedMs);
    });

    it('works with only a date column (no time column)', () => {
      const row = ['2024-06-01'];
      const mappings = [
        {
          columnIndex: 0,
          role: 'timestamp',
          timestampType: 'dateOnly',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: null,
          timezone: 'UTC'
        }
      ];
      const result = buildTimestamp(row, mappings, 'UTC');
      expectValidIsoUtc(result);
      const parsed = new Date(result);
      expect(parsed.getUTCFullYear()).toBe(
        new Date(
          computeExpectedUtcMs('2024-06-01', 'YYYY-MM-DD', 'UTC')
        ).getUTCFullYear()
      );
    });
  });

  // ─── Strategy 3: year + month + day ───────────────────────────────────────

  describe('year + month + day columns', () => {
    // Strategy 3 uses Date.UTC internally so it is machine-timezone-independent
    it('constructs the correct UTC timestamp from year, month, day', () => {
      const row = ['2023', '7', '4'];
      const mappings = [
        {
          columnIndex: 0,
          role: 'timestamp',
          timestampType: 'year',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        },
        {
          columnIndex: 1,
          role: 'timestamp',
          timestampType: 'month',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        },
        {
          columnIndex: 2,
          role: 'timestamp',
          timestampType: 'day',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        }
      ];
      const result = buildTimestamp(row, mappings, 'UTC');
      expectValidIsoUtc(result);
      const parsed = new Date(result);
      expect(parsed.getUTCFullYear()).toBe(2023);
      expect(parsed.getUTCMonth()).toBe(6); // July = 6
      expect(parsed.getUTCDate()).toBe(4);
    });

    it('includes optional hour, minute, second columns when present', () => {
      const row = ['2023', '11', '30', '14', '45', '30'];
      const makeYMDMapping = (columnIndex, timestampType) => ({
        columnIndex,
        role: 'timestamp',
        timestampType,
        dateFormat: null,
        timeFormat: null,
        timezone: 'UTC'
      });
      const mappings = [
        makeYMDMapping(0, 'year'),
        makeYMDMapping(1, 'month'),
        makeYMDMapping(2, 'day'),
        makeYMDMapping(3, 'hour'),
        makeYMDMapping(4, 'minute'),
        makeYMDMapping(5, 'second')
      ];
      const result = buildTimestamp(row, mappings, 'UTC');
      expectValidIsoUtc(result);
      const parsed = new Date(result);
      expect(parsed.getUTCHours()).toBe(14);
      expect(parsed.getUTCMinutes()).toBe(45);
      expect(parsed.getUTCSeconds()).toBe(30);
    });

    it('returns null when any of year, month, day is missing', () => {
      // Only year and month — no day
      const row = ['2023', '7'];
      const mappings = [
        {
          columnIndex: 0,
          role: 'timestamp',
          timestampType: 'year',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        },
        {
          columnIndex: 1,
          role: 'timestamp',
          timestampType: 'month',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        }
      ];
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });
  });

  // ─── Strategy 4: elapsed_seconds ─────────────────────────────────────────

  describe('elapsed_seconds columns', () => {
    it('adds elapsed seconds as ms offset to the base timestamp', () => {
      // Use year+month+day strategy for the base (timezone-independent)
      const makeYMDMapping = (columnIndex, timestampType) => ({
        columnIndex,
        role: 'timestamp',
        timestampType,
        dateFormat: null,
        timeFormat: null,
        timezone: 'UTC'
      });
      const rowBase = ['2024', '1', '1'];
      const baseMappings = [
        makeYMDMapping(0, 'year'),
        makeYMDMapping(1, 'month'),
        makeYMDMapping(2, 'day')
      ];
      const baseResult = buildTimestamp(rowBase, baseMappings, 'UTC');
      const baseMs = new Date(baseResult).getTime();

      // Add an elapsed_seconds column (3600 s = 1 hour)
      const rowWithElapsed = ['2024', '1', '1', '3600'];
      const mappingsWithElapsed = [
        makeYMDMapping(0, 'year'),
        makeYMDMapping(1, 'month'),
        makeYMDMapping(2, 'day'),
        {
          columnIndex: 3,
          role: 'timestamp',
          timestampType: 'elapsed_seconds',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        }
      ];
      const result = buildTimestamp(rowWithElapsed, mappingsWithElapsed, 'UTC');
      expectValidIsoUtc(result);
      expect(new Date(result).getTime()).toBe(baseMs + 3600 * 1000);
    });

    it('accumulates multiple elapsed_seconds columns', () => {
      const makeYMDMapping = (columnIndex, timestampType) => ({
        columnIndex,
        role: 'timestamp',
        timestampType,
        dateFormat: null,
        timeFormat: null,
        timezone: 'UTC'
      });
      // Base: 2024-01-01 00:00:00 UTC using year+month+day
      const baseRow = ['2024', '1', '1'];
      const baseMappings = [
        makeYMDMapping(0, 'year'),
        makeYMDMapping(1, 'month'),
        makeYMDMapping(2, 'day')
      ];
      const baseMs = new Date(
        buildTimestamp(baseRow, baseMappings, 'UTC')
      ).getTime();

      const row = ['2024', '1', '1', '1800', '900'];
      const mappings = [
        makeYMDMapping(0, 'year'),
        makeYMDMapping(1, 'month'),
        makeYMDMapping(2, 'day'),
        {
          columnIndex: 3,
          role: 'timestamp',
          timestampType: 'elapsed_seconds',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        },
        {
          columnIndex: 4,
          role: 'timestamp',
          timestampType: 'elapsed_seconds',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        }
      ];
      const result = buildTimestamp(row, mappings, 'UTC');
      expectValidIsoUtc(result);
      expect(new Date(result).getTime()).toBe(baseMs + (1800 + 900) * 1000);
    });

    it('treats value as Unix timestamp when elapsed_seconds has no base timestamp', () => {
      const row = ['3600'];
      const mappings = [
        {
          columnIndex: 0,
          role: 'timestamp',
          timestampType: 'elapsed_seconds',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        }
      ];
      const result = buildTimestamp(row, mappings, 'UTC');
      expectValidIsoUtc(result);
      expect(new Date(result).getTime()).toBe(3600 * 1000);
    });
  });

  // ─── Null / parse failure ─────────────────────────────────────────────────

  describe('unparseable / invalid inputs', () => {
    it('returns null when the cell value is not a valid date', () => {
      const row = ['not-a-date'];
      const mappings = makeMapping(0, 'datetime', {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timezone: 'UTC'
      });
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });

    it('returns null when the row has no timestamp mappings', () => {
      const row = ['42'];
      const mappings = [
        { columnIndex: 0, role: 'measurement', timestampType: null }
      ];
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });

    it('returns null when the cell is null', () => {
      const row = [null];
      const mappings = makeMapping(0, 'datetime', {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timezone: 'UTC'
      });
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });

    it('returns null when the cell is whitespace-only', () => {
      const row = ['   '];
      const mappings = makeMapping(0, 'datetime', {
        dateFormat: 'YYYY-MM-DD HH:mm:ss',
        timezone: 'UTC'
      });
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });

    it('returns null when elapsed_seconds value is not a number', () => {
      const row = ['2024', '1', '1', 'bad'];
      const makeYMDMapping = (columnIndex, timestampType) => ({
        columnIndex,
        role: 'timestamp',
        timestampType,
        dateFormat: null,
        timeFormat: null,
        timezone: 'UTC'
      });
      const mappings = [
        makeYMDMapping(0, 'year'),
        makeYMDMapping(1, 'month'),
        makeYMDMapping(2, 'day'),
        {
          columnIndex: 3,
          role: 'timestamp',
          timestampType: 'elapsed_seconds',
          dateFormat: null,
          timeFormat: null,
          timezone: 'UTC'
        }
      ];
      expect(buildTimestamp(row, mappings, 'UTC')).toBeNull();
    });
  });

  // ─── Non-UTC timezone ─────────────────────────────────────────────────────

  describe('non-UTC timezone', () => {
    // Use year+month+day strategy which is timezone-independent for the UTC
    // baseline, then compare against a timezone-aware variant.

    it('shifts Europe/Paris winter time to UTC (UTC+1 offset)', () => {
      // 2024-01-15 12:00:00 in Europe/Paris (UTC+1) → UTC is 11:00:00
      // Strategy 3 builds the wall-clock time via Date.UTC so the result
      // reflects the true UTC offset for the given IANA timezone.
      const makeMapping3 = (columnIndex, timestampType) => ({
        columnIndex,
        role: 'timestamp',
        timestampType,
        dateFormat: null,
        timeFormat: null,
        timezone: 'Europe/Paris'
      });
      const row = ['2024', '1', '15', '12', '0', '0'];
      const mappings = [
        makeMapping3(0, 'year'),
        makeMapping3(1, 'month'),
        makeMapping3(2, 'day'),
        makeMapping3(3, 'hour'),
        makeMapping3(4, 'minute'),
        makeMapping3(5, 'second')
      ];
      const result = buildTimestamp(row, mappings, 'Europe/Paris');
      expectValidIsoUtc(result);
      const utcHour = new Date(result).getUTCHours();
      // Paris is UTC+1 in January, so 12:00 Paris → 11:00 UTC
      expect(utcHour).toBe(11);
    });

    it('shifts Europe/Paris summer time to UTC (UTC+2 offset)', () => {
      // 2024-07-15 14:00:00 in Europe/Paris (UTC+2) → UTC is 12:00:00
      const makeMapping3 = (columnIndex, timestampType) => ({
        columnIndex,
        role: 'timestamp',
        timestampType,
        dateFormat: null,
        timeFormat: null,
        timezone: 'Europe/Paris'
      });
      const row = ['2024', '7', '15', '14', '0', '0'];
      const mappings = [
        makeMapping3(0, 'year'),
        makeMapping3(1, 'month'),
        makeMapping3(2, 'day'),
        makeMapping3(3, 'hour'),
        makeMapping3(4, 'minute'),
        makeMapping3(5, 'second')
      ];
      const result = buildTimestamp(row, mappings, 'Europe/Paris');
      expectValidIsoUtc(result);
      const utcHour = new Date(result).getUTCHours();
      // Paris is UTC+2 in July, so 14:00 Paris → 12:00 UTC
      expect(utcHour).toBe(12);
    });

    it('Paris result is earlier in UTC than the same wall-clock in UTC', () => {
      // Same wall-clock time produces different UTC values: Paris is ahead of
      // UTC, so its UTC equivalent is earlier.
      const makeMapping3Tz = (columnIndex, timestampType, tz) => ({
        columnIndex,
        role: 'timestamp',
        timestampType,
        dateFormat: null,
        timeFormat: null,
        timezone: tz
      });
      const row = ['2024', '1', '15', '10', '0', '0'];

      const utcMappings = [
        makeMapping3Tz(0, 'year', 'UTC'),
        makeMapping3Tz(1, 'month', 'UTC'),
        makeMapping3Tz(2, 'day', 'UTC'),
        makeMapping3Tz(3, 'hour', 'UTC'),
        makeMapping3Tz(4, 'minute', 'UTC'),
        makeMapping3Tz(5, 'second', 'UTC')
      ];
      const parisMappings = [
        makeMapping3Tz(0, 'year', 'Europe/Paris'),
        makeMapping3Tz(1, 'month', 'Europe/Paris'),
        makeMapping3Tz(2, 'day', 'Europe/Paris'),
        makeMapping3Tz(3, 'hour', 'Europe/Paris'),
        makeMapping3Tz(4, 'minute', 'Europe/Paris'),
        makeMapping3Tz(5, 'second', 'Europe/Paris')
      ];

      const utcResult = buildTimestamp(row, utcMappings, 'UTC');
      const parisResult = buildTimestamp(row, parisMappings, 'Europe/Paris');

      // Paris (UTC+1 in Jan) 10:00 → UTC 09:00, which is before UTC 10:00
      expect(new Date(parisResult).getTime()).toBeLessThan(
        new Date(utcResult).getTime()
      );
    });
  });
});
