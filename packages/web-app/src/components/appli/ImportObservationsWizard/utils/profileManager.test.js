import {
  exportProfile,
  importProfile,
  deriveProfileFileName
} from './profileManager';

describe('exportProfile', () => {
  it('produces expected JSON shape from a complete state', () => {
    const state = {
      encoding: 'UTF-8',
      headerRow: 2,
      skipFirstRows: 3,
      skipLastRows: 1,
      numberLocale: 'en',
      samplingIntervalSeconds: 900,
      confirmedDevice: { id: 'd1', name: 'Logger A' },
      sensorConfigs: [{ id: 'sc1', deviceId: 'd1', quantityKindId: 1 }],
      columnMappings: [
        {
          columnIndex: 0,
          role: 'timestamp',
          timestampType: 'datetime',
          timezone: 'Europe/Paris',
          dateFormat: 'DD/MM/YYYY HH:mm:ss'
        },
        {
          columnIndex: 1,
          role: 'measurement',
          sensorConfigurationId: 'sc1',
          mediumId: 2
        },
        { columnIndex: 2, role: 'excluded' }
      ],
      context: {
        caveId: 42,
        pointLabel: 'Salle du Chaos',
        latitude: '43.123',
        longitude: '2.987',
        authorIds: [7],
        licenseId: 1,
        documentTitle: 'Temp Jan 2024',
        observationName: 'Campaign Jan 2024',
        dataQuality: 'raw'
      }
    };

    const profile = exportProfile(state);

    expect(profile.encoding).toBe('UTF-8');
    expect(profile.headerRow).toBe(3);
    expect(profile.skipFirstRows).toBe(3);
    expect(profile.skipLastRows).toBe(1);
    expect(profile.numberLocale).toBe('en');
    expect(profile.samplingIntervalSeconds).toBe(900);
    expect(profile.timezone).toBe('Europe/Paris');
    expect(profile.dateFormat).toBe('DD/MM/YYYY HH:mm:ss');
    expect(profile.caveId).toBe(42);
    expect(profile.pointLabel).toBe('Salle du Chaos');
    expect(profile.latitude).toBe(43.123);
    expect(profile.longitude).toBe(2.987);
    expect(profile.authorIds).toEqual([7]);
    expect(profile.licenseId).toBe(1);
    expect(profile.documentTitle).toBe('Temp Jan 2024');
    expect(profile.observationName).toBe('Campaign Jan 2024');
    expect(profile.dataQuality).toBe('raw');
    expect(profile.deviceId).toBe('d1');
    expect(profile.confirmedDevice).toBeUndefined();
    expect(profile.sensorConfigs).toBeUndefined();
    expect(profile.columnMappings).toEqual([
      {
        columnIndex: 0,
        role: 'timestamp',
        timestampType: 'datetime'
      },
      {
        columnIndex: 1,
        role: 'measurement',
        sensorConfigurationId: 'sc1',
        mediumId: 2
      },
      { columnIndex: 2, role: 'excluded' }
    ]);
  });

  it('omits samplingIntervalSeconds when it is null', () => {
    const state = {
      encoding: 'UTF-8',
      headerRow: 0,
      skipLastRows: 0,
      numberLocale: 'en',
      samplingIntervalSeconds: null,
      columnMappings: [],
      context: {}
    };

    const profile = exportProfile(state);

    expect(profile).not.toHaveProperty('samplingIntervalSeconds');
  });

  it('omits samplingIntervalSeconds when it is undefined', () => {
    const state = {
      encoding: 'UTF-8',
      headerRow: 0,
      skipLastRows: 0,
      numberLocale: 'en',
      columnMappings: [],
      context: {}
    };

    const profile = exportProfile(state);

    expect(profile).not.toHaveProperty('samplingIntervalSeconds');
  });
});

describe('importProfile', () => {
  it('restores all fields from valid JSON', () => {
    const json = {
      encoding: 'windows-1252',
      headerRow: 3,
      skipLastRows: 2,
      numberLocale: 'fr',
      samplingIntervalSeconds: 600,
      columnMappings: [
        { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' }
      ],
      deviceId: 'd1',
      caveId: 10,
      pointLabel: 'Point A',
      latitude: '45.0',
      longitude: '3.0',
      authorId: 5,
      licenseId: 2,
      documentTitle: 'My Doc',
      observationName: 'Obs 1',
      dataQuality: 'validated'
    };

    const result = importProfile(json);

    expect(result.ok).toBe(true);
    expect(result.state.encoding).toBe('windows-1252');
    expect(result.state.headerRow).toBe(2);
    expect(result.state.skipLastRows).toBe(2);
    expect(result.state.numberLocale).toBe('fr');
    expect(result.state.samplingIntervalSeconds).toBe(600);
    expect(result.state.columnMappings).toEqual([
      { columnIndex: 0, role: 'timestamp', timestampType: 'datetime' }
    ]);
    expect(result.state.deviceId).toBe('d1');
    expect(result.state.context).toEqual({
      caveId: 10,
      pointLabel: 'Point A',
      latitude: '45.0',
      longitude: '3.0',
      authorIds: [5],
      licenseId: 2,
      documentTitle: 'My Doc',
      observationName: 'Obs 1',
      dataQuality: 'validated'
    });
  });

  it('returns { ok: false } for null input', () => {
    const result = importProfile(null);

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns { ok: false } for undefined input', () => {
    const result = importProfile(undefined);

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns { ok: false } for an array input', () => {
    const result = importProfile([1, 2, 3]);

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns { ok: false } for a non-object input', () => {
    const result = importProfile('not json');

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('ignores unknown keys without throwing', () => {
    const json = {
      encoding: 'UTF-8',
      headerRow: 0,
      skipLastRows: 0,
      numberLocale: 'en',
      columnMappings: [],
      unknownKey1: 'hello',
      anotherUnknownKey: { nested: true },
      futureFeatureFlag: 42
    };

    const result = importProfile(json);

    expect(result.ok).toBe(true);
    expect(result.state).not.toHaveProperty('unknownKey1');
    expect(result.state).not.toHaveProperty('anotherUnknownKey');
    expect(result.state).not.toHaveProperty('futureFeatureFlag');
  });

  it('does not include samplingIntervalSeconds when absent from JSON', () => {
    const json = {
      encoding: 'UTF-8',
      headerRow: 0,
      skipLastRows: 0,
      numberLocale: 'en',
      columnMappings: []
    };

    const result = importProfile(json);

    expect(result.ok).toBe(true);
    expect(result.state).not.toHaveProperty('samplingIntervalSeconds');
  });
});

describe('deriveProfileFileName', () => {
  it('strips spaces and appends _profile.json', () => {
    expect(deriveProfileFileName('Salle du Chaos')).toBe(
      'SalleduChaos_profile.json'
    );
  });

  it('strips special characters', () => {
    expect(deriveProfileFileName('Point #1 (test)')).toBe(
      'Point1test_profile.json'
    );
  });

  it('preserves hyphens and underscores', () => {
    expect(deriveProfileFileName('my-point_label')).toBe(
      'my-point_label_profile.json'
    );
  });

  it('handles an empty string', () => {
    expect(deriveProfileFileName('')).toBe('_profile.json');
  });

  it('handles null/undefined gracefully', () => {
    expect(deriveProfileFileName(null)).toBe('_profile.json');
    expect(deriveProfileFileName(undefined)).toBe('_profile.json');
  });

  it('strips unicode and accented characters', () => {
    expect(deriveProfileFileName('Grotte été')).toBe('Grottet_profile.json');
  });
});
