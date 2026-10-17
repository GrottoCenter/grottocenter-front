import clubSvg from '@/assets/icons/organization-club.svg?raw';
import rescueSvg from '@/assets/icons/organization-rescue.svg?raw';
import publisherSvg from '@/assets/icons/organization-publisher.svg?raw';
import researchSvg from '@/assets/icons/organization-research.svg?raw';
import administrationSvg from '@/assets/icons/organization-administration.svg?raw';
import conservationSvg from '@/assets/icons/organization-conservation.svg?raw';
import librarySvg from '@/assets/icons/organization-library.svg?raw';

const SOURCES = {
  SPELEOLOGY: clubSvg,
  CAVE_RESCUE: rescueSvg,
  EDITION: publisherSvg,
  RESEARCH: researchSvg,
  ADMINISTRATION: administrationSvg,
  NATURE_CONSERVATION: conservationSvg,
  LIBRARY: librarySvg
};
const mapSources = new Map();

// Only maps load/convert the SVG foregrounds. UI icon resolution stays cheap.
// Artwork marks transparent map cutouts explicitly, independently of UI colors.
export const getOrganizationMapIconSource = type => {
  if (!Object.hasOwn(SOURCES, type)) return null;
  if (!mapSources.has(type)) {
    const svgDocument = new DOMParser().parseFromString(
      SOURCES[type],
      'image/svg+xml'
    );
    const symbol = svgDocument.getElementById('organization-symbol');
    const svg = svgDocument.documentElement;
    svg.replaceChildren(symbol);
    svg.setAttribute('viewBox', '0 0 100 100');
    [symbol, ...symbol.querySelectorAll('[fill], [stroke]')].forEach(
      element => {
        ['fill', 'stroke'].forEach(attribute => {
          const paint = element.getAttribute(attribute);
          if (paint && paint !== 'none') {
            element.setAttribute(
              attribute,
              element.getAttribute(`data-map-${attribute}`) ?? '#fff'
            );
          }
        });
      }
    );
    mapSources.set(
      type,
      `data:image/svg+xml,${encodeURIComponent(
        new XMLSerializer().serializeToString(svg)
      )}`
    );
  }
  return mapSources.get(type);
};
