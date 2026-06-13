/**
 * Feature: device-sensors-step-rework
 *
 * Property-based tests for `QUANTITY_KIND_UNITS_MAP`.
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

import * as fc from 'fast-check';
import { QUANTITY_KINDS } from './quantityKinds';
import { UNITS } from './units';
import { QUANTITY_KIND_UNITS_MAP } from './quantityKindUnitsMap';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const validQuantityKindIds = new Set(QUANTITY_KINDS.map(qk => qk.id));
const validUnitIds = new Set(UNITS.map(u => u.id));
const mapKeys = Object.keys(QUANTITY_KIND_UNITS_MAP).map(Number);
const mapEntries = Object.entries(QUANTITY_KIND_UNITS_MAP).map(
  ([key, unitIds]) => [Number(key), unitIds]
);

// Arbitrary that picks a random key from the map
const mapKeyArb = fc.constantFrom(...mapKeys);

// Arbitrary that picks a random (key, unitIds) entry from the map
const mapEntryArb = fc.constantFrom(...mapEntries);

// ---------------------------------------------------------------------------
// Property 1: every key in QUANTITY_KIND_UNITS_MAP is a valid quantity kind ID
//
// Encodes: the mapping only references quantity kinds that exist in the
//          QUANTITY_KINDS enumeration. A key with no matching entry would
//          indicate an orphaned or incorrect mapping.
// Covers: all keys in the map.
// ---------------------------------------------------------------------------
describe('Property 1: map keys reference valid quantity kinds — Validates: Requirements 6.1, 6.2', () => {
  it('every quantityKindId key in QUANTITY_KIND_UNITS_MAP exists in QUANTITY_KINDS', () => {
    fc.assert(
      fc.property(mapKeyArb, quantityKindId => {
        expect(validQuantityKindIds.has(quantityKindId)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: every unit ID value in the map references a valid unit
//
// Encodes: the mapping only associates quantity kinds with units that exist
//          in the UNITS enumeration. A unit ID with no matching entry would
//          cause runtime errors in the dropdown population logic.
// Covers: all unit ID values across all entries in the map.
// ---------------------------------------------------------------------------
describe('Property 2: map values reference valid units — Validates: Requirements 6.2, 6.3', () => {
  it('every unitId value in QUANTITY_KIND_UNITS_MAP exists in UNITS', () => {
    fc.assert(
      fc.property(mapEntryArb, ([, unitIds]) => {
        unitIds.forEach(unitId => {
          expect(validUnitIds.has(unitId)).toBe(true);
        });
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: no duplicate unit IDs within a single quantity kind mapping
//
// Encodes: each quantity kind maps to a set of distinct compatible units.
//          Duplicates would cause duplicate entries in the unit dropdown.
// Covers: all entries in the map.
// ---------------------------------------------------------------------------
describe('Property 3: no duplicate unit IDs per quantity kind — Validates: Requirements 6.2, 6.4', () => {
  it('no quantity kind has duplicate unit IDs in its mapping', () => {
    fc.assert(
      fc.property(mapEntryArb, ([, unitIds]) => {
        const uniqueIds = new Set(unitIds);
        expect(uniqueIds.size).toBe(unitIds.length);
      }),
      { numRuns: 100 }
    );
  });
});
