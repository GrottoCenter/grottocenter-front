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

const ICONS = {
  SPELEOLOGY: ['organization_club', organizationClubIcon],
  CAVE_RESCUE: ['organization_rescue', organizationRescueIcon],
  EDITION: ['organization_publisher', organizationPublisherIcon],
  RESEARCH: ['organization_research', organizationResearchIcon],
  ADMINISTRATION: [
    'organization_administration',
    organizationAdministrationIcon
  ],
  NATURE_CONSERVATION: [
    'organization_conservation',
    organizationConservationIcon
  ],
  LIBRARY: ['organization_library', organizationLibraryIcon]
};

const getIcon = type =>
  Object.hasOwn(ICONS, type) ? ICONS[type] : ['organization', organizationIcon];

export const getOrganizationIconType = type => getIcon(type)[0];
export const getOrganizationIconSource = type => getIcon(type)[1];
