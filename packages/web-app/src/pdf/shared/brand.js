import entrance from '@/assets/icons/entrance.svg?raw';
import network from '@/assets/icons/network.svg?raw';
import massif from '@/assets/icons/massif.svg?raw';
import coordinates from '@/assets/icons/coordinates.svg?raw';
import altitude from '@/assets/icons/altitude.svg?raw';
import depth from '@/assets/icons/depth.svg?raw';
import length from '@/assets/icons/length.svg?raw';
import temperature from '@/assets/icons/temperature.svg?raw';
import location from '@/assets/icons/location.svg?raw';
import bibliography from '@/assets/icons/bibliography.svg?raw';
import guidelines from '@/assets/icons/guidelines.svg?raw';
import author from '@/assets/icons/author.svg?raw';
import timeToGo from '@/assets/icons/time-to-go.svg?raw';
import undergroundTime from '@/assets/icons/underground-time.svg?raw';
import discoveryDate from '@/assets/icons/discovery-date.svg?raw';
import category from '@/assets/icons/category.svg?raw';
import country from '@/assets/icons/country.svg?raw';
import organization from '@/assets/icons/organization.svg?raw';
import divingCave from '@/assets/icons/diving-cave.svg?raw';

const sources = {
  country,
  organization,
  diving_cave: divingCave,
  region: location,
  entrance,
  network,
  massif,
  coordinates,
  altitude,
  depth,
  length,
  temperature,
  location,
  bibliography,
  guidelines,
  author,
  time_to_go: timeToGo,
  underground_time: undergroundTime,
  discovery_date: discoveryDate,
  category
};
const supportedElements = new Set([
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'line',
  'polygon',
  'polyline'
]);
const attributes = {
  d: 'd',
  viewBox: 'viewBox',
  fill: 'fill',
  stroke: 'stroke',
  transform: 'transform',
  opacity: 'opacity',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-opacity': 'strokeOpacity',
  x: 'x',
  y: 'y',
  x1: 'x1',
  y1: 'y1',
  x2: 'x2',
  y2: 'y2',
  width: 'width',
  height: 'height',
  rx: 'rx',
  ry: 'ry',
  cx: 'cx',
  cy: 'cy',
  r: 'r',
  points: 'points'
};

export const parseBrandSvg = source => {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  if (document.querySelector('parsererror'))
    throw new Error('Invalid brand SVG');
  const convert = element => {
    // The existing icons' filtered gradient shadows are screen-only decoration.
    if (
      !supportedElements.has(element.localName) ||
      element.hasAttribute('filter')
    )
      return null;
    const props = Object.fromEntries(
      Array.from(element.attributes)
        .filter(attribute => attributes[attribute.name])
        .map(attribute => [attributes[attribute.name], attribute.value])
    );
    if (element.localName === 'svg' && !props.viewBox)
      props.viewBox = `0 0 ${props.width} ${props.height}`;
    return {
      type: element.localName,
      props,
      children: Array.from(element.children).map(convert).filter(Boolean)
    };
  };
  return convert(document.documentElement);
};

let icons;
let logo;
export const getPdfBrand = async (signal, palette) => {
  icons ??= Object.fromEntries(
    Object.entries(sources).map(([key, source]) => [key, parseBrandSvg(source)])
  );
  if (!logo) {
    const response = await fetch('/logo.svg', { signal });
    if (!response.ok) throw new Error(`Brand logo: HTTP ${response.status}`);
    logo = parseBrandSvg(await response.text());
  }
  signal.throwIfAborted();
  return {
    icons,
    logo,
    colors: {
      primary: palette.primary.main,
      primaryDark: palette.primary.dark,
      primaryLight: palette.primary.veryLight,
      contrastText: palette.primary.contrastText,
      accent: palette.secondary.main,
      text: palette.text.primary,
      muted: palette.text.secondary,
      border: palette.divider,
      paper: palette.background.paper,
      tableStripe: palette.action.hover,
      good: palette.success.main,
      satisfactory: palette.warning.main,
      insufficient: palette.error.main
    }
  };
};
