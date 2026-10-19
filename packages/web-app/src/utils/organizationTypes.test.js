import {
  getOrganizationTypeLabelId,
  isOrganizationType,
  ORGANIZATION_TYPE_VALUES,
  canOrganizationExplore,
  getDefaultOrganizationType
} from './organizationTypes';
import {
  getOrganizationIconSource,
  getOrganizationIconType
} from './organizationIcons';

describe('organization type vocabulary', () => {
  it('provides seven distinct pictograms with a safe generic fallback', () => {
    expect(
      new Set(ORGANIZATION_TYPE_VALUES.map(getOrganizationIconSource)).size
    ).toBe(7);
    [null, 'FUTURE', 'constructor'].forEach(type => {
      expect(getOrganizationIconType(type)).toBe('organization');
    });
  });

  it.each(ORGANIZATION_TYPE_VALUES)('restricts exploration for %s', type => {
    expect(canOrganizationExplore(type)).toBe(
      ['SPELEOLOGY', 'CAVE_RESCUE', 'RESEARCH'].includes(type)
    );
  });

  it.each([null, undefined, ''])(
    'preserves legacy club behavior for unclassified %s',
    type => {
      expect(canOrganizationExplore(type)).toBe(true);
    }
  );

  it('does not enable exploration for an unknown nonempty type', () => {
    expect(canOrganizationExplore('FUTURE')).toBe(false);
  });

  it.each([
    ['editor', 'EDITION'],
    ['library', 'LIBRARY'],
    ['authorsOrganization', ''],
    [null, '']
  ])('prefills %s with %s', (context, type) =>
    expect(getDefaultOrganizationType(context)).toBe(type)
  );
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
