import fc from 'fast-check';
import { parse, format as formatDate, isValid as isValidDate } from 'date-fns';
import { toDateFnsFormat } from '../../utils/momentToDateFnsFormat';
import {
  DATE_TOKENS,
  TIME_TOKENS,
  ALL_TOKENS,
  SEPARATORS,
  TOKENS_BY_TYPE,
  getTokensForType,
  getAvailableOptions,
  buildFormatString,
  parseFormatToPills,
  validateFormat
} from './timestampFormatUtils';

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const timestampTypeArb = fc.constantFrom('datetime', 'dateOnly', 'timeOnly');

/**
 * Generates a random subsequence of tokens for a given timestampType,
 * preserving uniqueness (tokens can only be used once).
 */
const tokenSubsequenceArb = timestampType => {
  const tokens = TOKENS_BY_TYPE[timestampType];
  return fc.shuffledSubarray(tokens, {
    minLength: 0,
    maxLength: tokens.length
  });
};

/**
 * Generates a random array of separator selections (with repetition allowed).
 */
const separatorSelectionArb = fc.array(fc.constantFrom(...SEPARATORS), {
  minLength: 0,
  maxLength: 10
});

/**
 * Generates a random interleaving of tokens and separators as pill objects.
 * Tokens are unique; separators can repeat.
 */
const pillSequenceArb = timestampType =>
  fc
    .tuple(tokenSubsequenceArb(timestampType), separatorSelectionArb)
    .chain(([tokens, separators]) => {
      // Interleave tokens and separators randomly
      const tokenPills = tokens.map(value => ({ value, type: 'token' }));
      const sepPills = separators.map(value => ({ value, type: 'separator' }));
      const allPills = [...tokenPills, ...sepPills];
      return fc.shuffledSubarray(allPills, {
        minLength: allPills.length,
        maxLength: allPills.length
      });
    })
    .map(pills => pills.map((p, i) => ({ id: `pill-${i + 1}`, ...p })));

/**
 * Generates a format string built from valid tokens and separators for a type.
 * Used for round-trip testing.
 */
const validFormatStringArb = timestampType =>
  pillSequenceArb(timestampType).map(pills => buildFormatString(pills));

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('timestampFormatUtils - Property-Based Tests', () => {
  /**
   * Property 1: Append preserves order and grows composition.
   * Encodes: selecting tokens/separators in order produces a pills array
   * where length equals the number of selections and order is preserved.
   * Validates: Requirements 1.1, 1.2, 1.4
   */
  describe('Property 1: Append preserves order and grows composition', () => {
    it('pills array has length equal to number of selections and each pill appears at its selection index', () => {
      fc.assert(
        fc.property(timestampTypeArb, fc.gen(), (timestampType, gen) => {
          const tokens = getTokensForType(timestampType);
          // Generate a random sequence of selections
          const selectionCount = gen(fc.integer, {
            min: 0,
            max: tokens.length + 5
          });
          const pills = [];
          const usedTokens = new Set();

          for (let i = 0; i < selectionCount; i += 1) {
            const available = getAvailableOptions(pills, timestampType);
            if (available.length === 0) break;

            const idx = gen(fc.integer, { min: 0, max: available.length - 1 });
            const selected = available[idx];
            const pill = {
              id: `pill-${pills.length + 1}`,
              value: selected.value,
              type: selected.type
            };
            pills.push(pill);
            if (selected.type === 'token') {
              usedTokens.add(selected.value);
            }
          }

          // Assert length equals number of selections made
          expect(pills.length).toBeLessThanOrEqual(selectionCount);
          // Assert each pill appears at its selection index
          pills.forEach((pill, idx) => {
            expect(pill.id).toBe(`pill-${idx + 1}`);
          });
          // Assert order is preserved: values match selection order
          const values = pills.map(p => p.value);
          for (let i = 0; i < values.length; i += 1) {
            expect(pills[i].value).toBe(values[i]);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Token availability invariant.
   * Encodes: available tokens = full token set minus used tokens;
   * separators always present regardless of usage count.
   * Validates: Requirements 1.3, 1.7, 2.2
   */
  describe('Property 2: Token availability invariant', () => {
    it('available tokens equals full set minus used tokens, and all separators are always present', () => {
      fc.assert(
        fc.property(timestampTypeArb, fc.gen(), (timestampType, gen) => {
          const fullTokens = getTokensForType(timestampType);
          const pills = [];

          // Perform a sequence of add/remove operations
          const opCount = gen(fc.integer, { min: 1, max: 15 });
          for (let i = 0; i < opCount; i += 1) {
            const shouldRemove = pills.length > 0 && gen(fc.boolean);
            if (shouldRemove) {
              // Remove a random pill
              const removeIdx = gen(fc.integer, {
                min: 0,
                max: pills.length - 1
              });
              pills.splice(removeIdx, 1);
            } else {
              // Add from available options
              const available = getAvailableOptions(pills, timestampType);
              if (available.length > 0) {
                const idx = gen(fc.integer, {
                  min: 0,
                  max: available.length - 1
                });
                const selected = available[idx];
                pills.push({
                  id: `pill-${Date.now()}-${i}`,
                  value: selected.value,
                  type: selected.type
                });
              }
            }
          }

          // Verify invariant at current state
          const available = getAvailableOptions(pills, timestampType);
          const availableTokenValues = available
            .filter(o => o.type === 'token')
            .map(o => o.value);
          const availableSepValues = available
            .filter(o => o.type === 'separator')
            .map(o => o.value);

          const usedTokens = new Set(
            pills.filter(p => p.type === 'token').map(p => p.value)
          );

          // Compute excluded tokens: used + their exclusive counterparts
          const exclusivePairs = [
            ['YYYY', 'YY'],
            ['MM', 'M'],
            ['DD', 'D'],
            ['HH', 'H'],
            ['HH', 'hh'],
            ['HH', 'h'],
            ['H', 'hh'],
            ['H', 'h'],
            ['hh', 'h'],
            ['mm', 'm'],
            ['ss', 's']
          ];
          const excludedTokens = new Set(usedTokens);
          for (const [a, b] of exclusivePairs) {
            if (usedTokens.has(a)) excludedTokens.add(b);
            if (usedTokens.has(b)) excludedTokens.add(a);
          }

          const expectedTokens = fullTokens.filter(t => !excludedTokens.has(t));

          // Token availability = full set minus used
          expect(availableTokenValues.sort()).toEqual(expectedTokens.sort());
          // All separators always present
          expect(availableSepValues.sort()).toEqual([...SEPARATORS].sort());
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Format string is concatenation of pill values.
   * Encodes: buildFormatString(pills) === pills.map(p => p.value).join('')
   * and empty composition produces empty string.
   * Validates: Requirements 1.8, 2.3, 2.4
   */
  describe('Property 3: Format string is concatenation of pill values', () => {
    it('format string equals concatenation of all pill values in display order', () => {
      fc.assert(
        fc.property(timestampTypeArb, timestampType =>
          // Test with generated pill sequence
          fc.assert(
            fc.property(pillSequenceArb(timestampType), pills => {
              const formatString = buildFormatString(pills);
              const expected = pills.map(p => p.value).join('');
              expect(formatString).toBe(expected);
            }),
            { numRuns: 50 }
          )
        ),
        { numRuns: 3 }
      );
    });

    it('empty composition produces empty format string', () => {
      const formatString = buildFormatString([]);
      expect(formatString).toBe('');
    });
  });

  /**
   * Property 4: Validation correctness (strict round-trip).
   * Encodes: validation result is true iff every sample value parses
   * successfully with date-fns AND formats back to the original string.
   * This enforces padding strictness (e.g. "1" fails for "dd" format).
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  describe('Property 4: Validation correctness', () => {
    it('validation result matches strict round-trip check of all sample values', () => {
      // Generate format strings that are likely to produce valid dates
      const knownFormats = [
        'YYYY-MM-DD',
        'MM/DD/YYYY',
        'DD-MM-YYYY',
        'HH:mm:ss',
        'YYYY-MM-DD HH:mm',
        'YY/MM/DD'
      ];
      const formatArb = fc.constantFrom(...knownFormats);

      // Generate sample values: mix of valid dates and random strings
      const validDateArb = fc
        .tuple(
          fc.integer({ min: 2000, max: 2030 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 0, max: 23 }),
          fc.integer({ min: 0, max: 59 }),
          fc.integer({ min: 0, max: 59 })
        )
        .map(([y, m, d, h, min, s]) => new Date(y, m - 1, d, h, min, s));

      const sampleValuesArb = format => {
        const dfFmt = toDateFnsFormat(format);
        return fc.array(
          fc.oneof(
            // Valid values formatted with the given format
            validDateArb.map(date => formatDate(date, dfFmt)),
            // Random strings that likely won't parse
            fc.string({ minLength: 1, maxLength: 15 })
          ),
          { minLength: 1, maxLength: 10 }
        );
      };

      fc.assert(
        fc.property(formatArb, format => {
          const dfFmt = toDateFnsFormat(format);
          fc.assert(
            fc.property(sampleValuesArb(format), samples => {
              const result = validateFormat(format, samples);

              // Independently verify: parse + strict round-trip
              const allValid = samples.every(v => {
                const parsed = parse(v, dfFmt, new Date(0));
                if (!isValidDate(parsed) || isNaN(parsed.getTime())) {
                  return false;
                }
                // Strict: format back and compare
                return formatDate(parsed, dfFmt) === v;
              });

              expect(result.isValid).toBe(allValid);
            }),
            { numRuns: 50 }
          );
        }),
        { numRuns: 6 }
      );
    });
  });

  /**
   * Property 5: Token filtering by timestampType.
   * Encodes: initial available set matches expected token/separator sets
   * per timestampType.
   * Validates: Requirements 7.1, 7.2, 7.3
   */
  describe('Property 5: Token filtering by timestampType', () => {
    it('initial available options match expected sets for each timestampType', () => {
      fc.assert(
        fc.property(timestampTypeArb, timestampType => {
          const emptyPills = [];
          const available = getAvailableOptions(emptyPills, timestampType);
          const tokenValues = available
            .filter(o => o.type === 'token')
            .map(o => o.value);
          const sepValues = available
            .filter(o => o.type === 'separator')
            .map(o => o.value);

          // Separators always include all separators
          expect(sepValues.sort()).toEqual([...SEPARATORS].sort());

          switch (timestampType) {
            case 'datetime':
              expect(tokenValues.sort()).toEqual([...ALL_TOKENS].sort());
              break;
            case 'dateOnly':
              expect(tokenValues.sort()).toEqual([...DATE_TOKENS].sort());
              // No time tokens present
              TIME_TOKENS.forEach(t => {
                expect(tokenValues).not.toContain(t);
              });
              break;
            case 'timeOnly':
              expect(tokenValues.sort()).toEqual([...TIME_TOKENS].sort());
              // No date tokens present
              DATE_TOKENS.forEach(t => {
                expect(tokenValues).not.toContain(t);
              });
              break;
            default:
              break;
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: Format string round-trip (parse ↔ build).
   * Encodes: parseFormatToPills(buildFormatString(pills)) === pills (values)
   * i.e., building then parsing is identity on pill values.
   * Validates: Requirements 6.1, 8.2
   */
  describe('Property 6: Format string round-trip (parse ↔ build)', () => {
    it('parsing a format string into pills and rebuilding produces the original format string', () => {
      fc.assert(
        fc.property(timestampTypeArb, timestampType => {
          fc.assert(
            fc.property(validFormatStringArb(timestampType), formatString => {
              const pills = parseFormatToPills(formatString, timestampType);
              const rebuilt = buildFormatString(pills);
              expect(rebuilt).toBe(formatString);
            }),
            { numRuns: 50 }
          );
        }),
        { numRuns: 3 }
      );
    });
  });
});
