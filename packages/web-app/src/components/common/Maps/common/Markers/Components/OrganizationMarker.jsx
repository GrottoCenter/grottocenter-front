import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { getOrganizationMapIconSource } from '@/utils/organizationMapIcons';
import { ORGANIZATION_TYPE_VALUES } from '@/utils/organizationTypes';
import { ORGANIZATION_MARKER_COLOR } from '@/components/common/Maps/common/mapMarkerColors';
import {
  MAP_MARKER_OUTLINE_COLOR,
  MAP_MARKER_OUTLINE_WIDTH
} from '@/components/common/Maps/common/mapMarkerOutline';

// All organization pins reuse the shared SVG foreground, including the generic
// fallback. The 100×130 viewBox preserves the square body and its pointer.
const createOrganizationMarker = (type = null) =>
  L.divIcon({
    html: renderToString(
      <svg
        viewBox="0 0 100 130"
        width="30"
        height="39"
        xmlns="http://www.w3.org/2000/svg"
        data-organization-type={type ?? undefined}>
        <path
          d="M14 2 H86 Q98 2 98 14 V86 Q98 98 86 98 H67 L50 128 L33 98 H14 Q2 98 2 86 V14 Q2 2 14 2 Z"
          fill={ORGANIZATION_MARKER_COLOR}
          stroke={MAP_MARKER_OUTLINE_COLOR}
          strokeWidth={MAP_MARKER_OUTLINE_WIDTH}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        <image
          href={getOrganizationMapIconSource(type)}
          x="2.5"
          y="2.25"
          width="100"
          height="100"
        />
      </svg>
    ),
    iconSize: [30, 39],
    iconAnchor: [15, 39],
    className: ''
  });

export const OrganizationMarker = createOrganizationMarker();

// Cache the seven typed icons instead of rebuilding SVGs for each marker.
const typedMarkers = new Map(
  ORGANIZATION_TYPE_VALUES.map(type => [type, createOrganizationMarker(type)])
);

export const getOrganizationMarker = organization =>
  typedMarkers.get(organization?.type) ?? OrganizationMarker;

export const shouldReplaceOrganizationMarker = (previous, next) =>
  ['type', 'name', 'address', 'latitude', 'longitude'].some(
    field => previous[field] !== next[field]
  );

export default OrganizationMarker;
