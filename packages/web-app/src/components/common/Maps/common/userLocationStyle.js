// Shared visual identity for the user's own position on the map: the blue dot,
// its accuracy circle and the follow state of the location control. Kept in one
// place so the marker and the control button always agree on the colour.

// Standard "blue dot" of navigation apps. Matches the accuracy circle already
// used by MapMarkerSelector so the whole app reads as one system.
export const USER_LOCATION_COLOR = '#1976d2';

// In heading-up (compass) mode, place the user in the lower third of the
// viewport so more of what's ahead is visible (Google Maps convention).
export const HEADING_UP_OFFSET_RATIO = 0.66;

export const ACCURACY_CIRCLE_STYLE = {
  color: USER_LOCATION_COLOR,
  fillColor: USER_LOCATION_COLOR,
  fillOpacity: 0.1,
  weight: 1
};
