import { makeEntranceData, hasEntranceChanged } from './transformers';
import { ENTRANCE_ONLY } from './caveType';

const originalEntrance = {
  name: 'An entrance',
  language: 'eng',
  latitude: 45,
  longitude: 5,
  precision: 12
};

const serializeEntrance = overrides =>
  makeEntranceData(
    {
      cave: { id: 1 },
      entrance: { ...originalEntrance, ...overrides }
    },
    ENTRANCE_ONLY
  );

describe('entrance precision', () => {
  it('detects an accuracy-only edit with unchanged coordinates', () => {
    const payload = serializeEntrance({ precision: '8' });
    expect(payload.precision).toBe(8);
    expect(hasEntranceChanged(payload, originalEntrance)).toBe(true);
  });

  it('does not report a change for an unchanged numeric input', () => {
    const payload = serializeEntrance({ precision: '12' });
    expect(hasEntranceChanged(payload, originalEntrance)).toBe(false);
  });

  it.each(['', null, undefined])('clears accuracy when it is %s', precision => {
    const payload = serializeEntrance({ precision });
    expect(payload.precision).toBeNull();
    expect(hasEntranceChanged(payload, originalEntrance)).toBe(true);
  });

  it('keeps unknown accuracy unchanged', () => {
    const payload = serializeEntrance({ precision: '' });
    expect(
      hasEntranceChanged(payload, { ...originalEntrance, precision: null })
    ).toBe(false);
  });

  it('preserves accuracy when coordinates change', () => {
    const payload = serializeEntrance({ latitude: '45.1' });
    expect(payload.precision).toBe(12);
    expect(hasEntranceChanged(payload, originalEntrance)).toBe(true);
  });

  it('omits accuracy when the coordinates are hidden', () => {
    const payload = serializeEntrance({ latitude: null, longitude: null });
    expect(payload).not.toHaveProperty('precision');
    expect(hasEntranceChanged(payload, originalEntrance)).toBe(false);
  });
});
