import { makeEntranceData } from './transformers';
import { ENTRANCE_ONLY } from './caveType';

describe('optional entrance numeric fields', () => {
  it.each([
    [0, 0],
    ['0', 0],
    [-9999, -9999],
    ['9999', 9999],
    ['', null],
    [null, null],
    [undefined, null]
  ])('converts %s to %s without losing zero', (value, expected) => {
    const data = makeEntranceData(
      {
        cave: { id: 1 },
        entrance: {
          name: 'Entrance',
          language: 'eng',
          altitude: value,
          yearDiscovery: value
        }
      },
      ENTRANCE_ONLY
    );
    expect(data.altitude).toBe(expected);
    expect(data.yearDiscovery).toBe(expected);
  });
});
