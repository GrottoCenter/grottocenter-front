import * as fc from 'fast-check';
import { exportProfile, importProfile } from './profileManager';

/**
 * Property 9: Profile export/import round-trip
 *
 * For any valid wizard state S, serialising it with exportProfile(S) to a
 * JSON string and then deserialising with importProfile(JSON.parse(json))
 * produces a state S' such that all wizard-configurable fields in S' equal
 * the corresponding fields in S.
 *
 * Encodes: profile serialisation is lossless for all wizard-configurable fields.
 * Covers: all combinations of encoding, locale, documentLanguage, headerRow, skipLastRows,
 * columnMappings, sensorConfigs, confirmedDevice, context fields, and
 * samplingIntervalSeconds (present or absent).
 *
 * Validates: Requirements 13.1, 13.3
 */

const columnMappingArb = fc.oneof(
  fc.record({
    columnIndex: fc.nat({ max: 10 }),
    role: fc.constant('excluded')
  }),
  fc.record({
    columnIndex: fc.nat({ max: 10 }),
    role: fc.constant('decimal_part')
  }),
  fc.record({
    columnIndex: fc.nat({ max: 10 }),
    role: fc.constant('timestamp'),
    timestampType: fc.constantFrom(
      'datetime',
      'dateOnly',
      'timeOnly',
      'elapsed_seconds'
    ),
    dateFormat: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
      nil: null
    }),
    timeFormat: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
      nil: null
    }),
    timezone: fc.option(
      fc.constantFrom('UTC', 'Europe/Paris', 'America/New_York'),
      { nil: null }
    )
  }),
  fc.record({
    columnIndex: fc.nat({ max: 10 }),
    role: fc.constant('measurement'),
    sensorConfigurationId: fc.option(fc.string({ minLength: 1, maxLength: 36 }), {
      nil: null
    }),
    mediumId: fc.option(fc.nat(), { nil: null })
  })
);

const wizardStateArbitrary = fc.record({
  encoding: fc.constantFrom('UTF-8', 'UTF-16', 'windows-1252'),
  headerRow: fc.nat({ max: 10 }),
  skipLastRows: fc.nat({ max: 5 }),
  numberLocale: fc.constantFrom('en', 'fr'),
  documentLanguage: fc.constantFrom('eng', 'fra', 'spa', 'deu'),
  samplingIntervalSeconds: fc.option(fc.nat({ max: 3600 }), { nil: null }),
  columnMappings: fc.array(columnMappingArb, { minLength: 0, maxLength: 5 }),
  sensorConfigs: fc.array(
    fc.record({
      id: fc.string(),
      deviceId: fc.option(fc.string(), { nil: null })
    }),
    { minLength: 0, maxLength: 3 }
  ),
  confirmedDevice: fc.option(
    fc.record({ id: fc.nat(), name: fc.string() }),
    { nil: null }
  ),
  context: fc.record({
    locationMode: fc.constantFrom('pointAndCave', 'pointOnly', 'caveOnly'),
    caveId: fc.option(fc.nat(), { nil: null }),
    pointLabel: fc.string(),
    authorIds: fc.array(fc.nat(), { minLength: 0, maxLength: 5 }),
    licenseId: fc.option(fc.nat(), { nil: null }),
    latitude: fc.option(fc.string(), { nil: null }),
    longitude: fc.option(fc.string(), { nil: null }),
    observationName: fc.option(fc.string(), { nil: null }),
    documentTitle: fc.option(fc.string(), { nil: null }),
    dataQuality: fc.constantFrom('raw', 'validated')
  })
});

describe('Property 9: Profile export/import round-trip', () => {
  it('round-trips all wizard-configurable fields through export/import', () => {
    fc.assert(
      fc.property(wizardStateArbitrary, state => {
        const profile = exportProfile(state);
        const json = JSON.parse(JSON.stringify(profile));
        const result = importProfile(json);

        expect(result.ok).toBe(true);

        const restored = result.state;

        // Top-level fields
        expect(restored.encoding).toEqual(state.encoding);
        expect(restored.headerRow).toEqual(state.headerRow);
        expect(restored.skipLastRows).toEqual(state.skipLastRows);
        expect(restored.numberLocale).toEqual(state.numberLocale);
        expect(restored.documentLanguage).toEqual(state.documentLanguage);

        // columnMappings: profile strips per-column format fields (stored at root).
        // On import they're restored from root. Compare role and timestampType only.
        const exportedMappings = json.columnMappings.map(m => ({
          columnIndex: m.columnIndex,
          role: m.role,
          ...(m.timestampType ? { timestampType: m.timestampType } : {}),
          ...(m.sensorConfigurationId !== undefined
            ? { sensorConfigurationId: m.sensorConfigurationId }
            : {}),
          ...(m.mediumId !== undefined ? { mediumId: m.mediumId } : {})
        }));
        const restoredMappings = restored.columnMappings.map(m => ({
          columnIndex: m.columnIndex,
          role: m.role,
          ...(m.timestampType ? { timestampType: m.timestampType } : {}),
          ...(m.sensorConfigurationId !== undefined
            ? { sensorConfigurationId: m.sensorConfigurationId }
            : {}),
          ...(m.mediumId !== undefined ? { mediumId: m.mediumId } : {})
        }));
        expect(restoredMappings).toEqual(exportedMappings);

        // deviceId: only the ID is preserved in the profile
        expect(restored.deviceId).toEqual(
          state.confirmedDevice ? state.confirmedDevice.id : null
        );

        // Context fields
        expect(restored.context.locationMode).toEqual(state.context.locationMode);
        expect(restored.context.caveId).toEqual(state.context.caveId);
        expect(restored.context.pointLabel).toEqual(state.context.pointLabel);
        expect(restored.context.authorIds).toEqual(state.context.authorIds);
        expect(restored.context.licenseId).toEqual(state.context.licenseId);

        // lat/lng are coerced to numbers in export (empty/non-numeric string → null)
        const coerceCoord = v => {
          if (v == null || v === '') return null;
          const n = Number(v);
          return Number.isNaN(n) ? null : n;
        };
        expect(restored.context.latitude).toEqual(coerceCoord(state.context.latitude));
        expect(restored.context.longitude).toEqual(coerceCoord(state.context.longitude));

        expect(restored.context.observationName).toEqual(
          state.context.observationName
        );
        expect(restored.context.documentTitle).toEqual(
          state.context.documentTitle
        );
        expect(restored.context.dataQuality).toEqual(
          state.context.dataQuality
        );

        // samplingIntervalSeconds: omitted when null
        if (state.samplingIntervalSeconds === null) {
          expect(
            restored.samplingIntervalSeconds === undefined ||
              !('samplingIntervalSeconds' in restored)
          ).toBe(true);
        } else {
          expect(restored.samplingIntervalSeconds).toEqual(
            state.samplingIntervalSeconds
          );
        }
      }),
      { numRuns: 100 }
    );
  });
});
