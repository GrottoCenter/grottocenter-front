import {
  getOrganizationTypeLabelId,
  isOrganizationType,
  ORGANIZATION_TYPE_VALUES
} from './organizationTypes';

describe('organization type vocabulary', () => {
  it.each(ORGANIZATION_TYPE_VALUES)('accepts and labels %s', type => {
    expect(isOrganizationType(type)).toBe(true);
    expect(getOrganizationTypeLabelId(type)).not.toMatch(/unknown|unspecified/);
  });

  it.each([null, undefined, ''])(
    'labels unclassified references (%s)',
    type => {
      expect(isOrganizationType(type)).toBe(false);
      expect(getOrganizationTypeLabelId(type)).toBe(
        'organizationType.unspecified'
      );
    }
  );

  it.each(['FUTURE_TYPE', 'constructor', 'toString'])(
    'handles unknown %s safely',
    type => {
      expect(isOrganizationType(type)).toBe(false);
      expect(getOrganizationTypeLabelId(type)).toBe('organizationType.unknown');
    }
  );
});
