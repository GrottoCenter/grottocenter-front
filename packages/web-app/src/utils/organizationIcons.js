import {
  organizationIcon,
  organizationAdministrationIcon,
  organizationClubIcon,
  organizationConservationIcon,
  organizationLibraryIcon,
  organizationPublisherIcon,
  organizationRescueIcon,
  organizationResearchIcon
} from '@/assets/icons';
import clubSvg from '@/assets/icons/organization-club.svg?raw';
import rescueSvg from '@/assets/icons/organization-rescue.svg?raw';
import publisherSvg from '@/assets/icons/organization-publisher.svg?raw';
import researchSvg from '@/assets/icons/organization-research.svg?raw';
import administrationSvg from '@/assets/icons/organization-administration.svg?raw';
import conservationSvg from '@/assets/icons/organization-conservation.svg?raw';
import librarySvg from '@/assets/icons/organization-library.svg?raw';

const ICONS = {
  SPELEOLOGY: ['organization_club', organizationClubIcon, clubSvg],
  CAVE_RESCUE: ['organization_rescue', organizationRescueIcon, rescueSvg],
  EDITION: ['organization_publisher', organizationPublisherIcon, publisherSvg],
  RESEARCH: ['organization_research', organizationResearchIcon, researchSvg],
  ADMINISTRATION: [
    'organization_administration',
    organizationAdministrationIcon,
    administrationSvg
  ],
  NATURE_CONSERVATION: [
    'organization_conservation',
    organizationConservationIcon,
    conservationSvg
  ],
  LIBRARY: ['organization_library', organizationLibraryIcon, librarySvg]
};

const getIcon = type =>
  Object.hasOwn(ICONS, type) ? ICONS[type] : ['organization', organizationIcon];

export const getOrganizationIconType = type => getIcon(type)[0];
export const getOrganizationIconSource = type => getIcon(type)[1];

// Map pins share the foreground drawing, while retaining their yellow body.
// Export a white symbol only: the brown card, shadow and accent colors belong
// to UI icons. The rescue circle becomes an outline to keep its cross visible.
const MAP_SOURCES = Object.fromEntries(
  Object.entries(ICONS).map(([type, [, , svg]]) => {
    const symbol = svg.match(/<g id="organization-symbol"[\s\S]*<\/g>/)[0];
    const cutoutSymbol =
      type === 'CAVE_RESCUE'
        ? symbol.replace('fill="#f57c00"', 'fill="none"')
        : symbol;
    const whiteSymbol = cutoutSymbol.replace(
      /\b(fill|stroke)="(?!none")[^"]+"/g,
      '$1="#fff"'
    );
    return [
      type,
      `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${whiteSymbol}</svg>`
      )}`
    ];
  })
);

export const getOrganizationMapIconSource = type =>
  Object.hasOwn(MAP_SOURCES, type) ? MAP_SOURCES[type] : null;
