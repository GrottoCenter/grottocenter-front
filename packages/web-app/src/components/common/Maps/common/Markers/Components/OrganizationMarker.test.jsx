import { amber } from '@mui/material/colors';
import { getOrganizationMapIconSource } from '@/utils/organizationIcons';
import { ORGANIZATION_TYPE_VALUES } from '@/utils/organizationTypes';
import {
  getOrganizationMarker,
  OrganizationMarker
} from './OrganizationMarker';

it.each(ORGANIZATION_TYPE_VALUES)(
  'shares the %s pictogram between UI and map pins',
  type => {
    const marker = getOrganizationMarker({ type });
    const preview = document.createElement('div');
    preview.innerHTML = marker.options.html;
    expect(preview.querySelector('image').getAttribute('href')).toBe(
      getOrganizationMapIconSource(type)
    );
    expect(preview.querySelector('path')).toHaveAttribute('fill', amber[500]);
    const symbol = decodeURIComponent(
      getOrganizationMapIconSource(type).split(',')[1]
    );
    expect(symbol).toContain('id="organization-symbol"');
    const foreground = new DOMParser().parseFromString(symbol, 'image/svg+xml');
    foreground.querySelectorAll('[fill], [stroke]').forEach(element => {
      ['fill', 'stroke'].forEach(attribute => {
        const paint = element.getAttribute(attribute);
        if (paint) expect(['#fff', 'none']).toContain(paint);
      });
    });
    expect(marker.options.html).toContain(`data-organization-type="${type}"`);
    expect(marker.options.iconAnchor).toEqual([15, 39]);
    expect(getOrganizationMarker({ type })).toBe(marker);
  }
);
it.each([null, undefined, 'FUTURE', 'constructor'])(
  'uses the generic marker for %s',
  type => {
    expect(getOrganizationMarker({ type })).toBe(OrganizationMarker);
  }
);
