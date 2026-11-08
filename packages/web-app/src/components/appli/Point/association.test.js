import { getPointAssociation } from './association';

describe('point entrance/network presentation', () => {
  const cave = {
    id: 11,
    name: 'Network name',
    entrances: [{ id: 101, name: 'Entrance name' }]
  };

  it.each([
    ['entrance', { id: 101, name: 'Entrance name' }],
    ['network', { id: 11, name: 'Network name' }]
  ])(
    'uses the new %s association instead of the legacy cave',
    (type, value) => {
      expect(getPointAssociation({ [type]: value, caveId: 99 }, cave)).toEqual({
        type,
        ...value
      });
    }
  );

  it('does not fall back when the new contract explicitly has no association', () => {
    expect(
      getPointAssociation({ entrance: null, network: null, caveId: 11 }, cave)
    ).toBeNull();
  });

  // DELETE these caveId fallback cases with getLegacyAssociation after
  // https://github.com/GrottoCenter/grottocenter-api/issues/1978 is deployed.
  it('presents a legacy single-entrance cave as its entrance', () => {
    expect(getPointAssociation({ caveId: 11 }, cave)).toEqual({
      type: 'entrance',
      id: 101,
      name: 'Entrance name'
    });
  });

  it('presents a legacy multi-entrance cave as a network, ignoring deleted entrances', () => {
    expect(
      getPointAssociation(
        { caveId: 11 },
        {
          ...cave,
          entrances: [...cave.entrances, { id: 102, isDeleted: true }]
        }
      )
    ).toMatchObject({ type: 'entrance', id: 101 });
    expect(
      getPointAssociation(
        { caveId: 11 },
        { ...cave, entrances: [...cave.entrances, { id: 102 }] }
      )
    ).toEqual({ type: 'network', id: 11, name: 'Network name' });
  });

  it('shows no legacy association without a displayable entrance', () => {
    expect(
      getPointAssociation({ caveId: 11 }, { ...cave, entrances: [] })
    ).toBeNull();
    expect(getPointAssociation({}, cave)).toBeNull();
  });
});
