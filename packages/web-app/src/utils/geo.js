// Pure geospatial helpers shared by the map: point-to-point bearing, cardinal
// direction and human-readable distance formatting. No React, no DOM, no
// Leaflet — easy to unit test. The actual distance measurement uses Leaflet's
// L.latLng().distanceTo() at call sites (same as MeasureControl).

import { normalizeDeg } from './compass';

export const METERS_PER_MILE = 1609.344;

const toRad = deg => (deg * Math.PI) / 180;
const toDeg = rad => (rad * 180) / Math.PI;

// 16-point compass rose, clockwise from North.
const CARDINALS = [
  'N', 'NNE', 'NE', 'ENE',
  'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW',
  'W', 'WNW', 'NW', 'NNW'
];

// Initial great-circle bearing (forward azimuth) from `a` to `b`, in degrees
// [0, 360) where 0 = North, 90 = East. Points are { lat, lng } in degrees.
export const initialBearing = (a, b) => {
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δλ = toRad(b.lng - a.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normalizeDeg(toDeg(Math.atan2(y, x)));
};

// Map a bearing in degrees to its 16-point cardinal label ('N', 'NNE', …).
export const bearingToCardinal = deg =>
  CARDINALS[Math.round(normalizeDeg(deg) / 22.5) % 16];

// Human-readable distance: metric (m below 1 km, else km) plus imperial (miles).
// Uses Intl.NumberFormat so the unit label follows the active locale.
// Moved here from MeasureControl so both the measure tool and the waypoint HUD
// share a single implementation.
export const formatDistance = (meters, locale) => {
  const fmtMeter = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'meter',
    maximumFractionDigits: 0
  });
  const fmtKm = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilometer',
    maximumFractionDigits: 2
  });
  const fmtMile = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'mile',
    maximumFractionDigits: 2
  });
  const metricStr =
    meters < 1000 ? fmtMeter.format(meters) : fmtKm.format(meters / 1000);
  const imperialStr = fmtMile.format(meters / METERS_PER_MILE);
  return `${metricStr} · ${imperialStr}`;
};
