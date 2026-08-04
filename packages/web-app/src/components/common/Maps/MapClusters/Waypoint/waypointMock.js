// Dev-only mock so the full waypoint rendering (pin, line, bottom HUD and the
// off-screen indicator) can be reviewed without any real geolocation.
//
// Enable it by adding this line to packages/web-app/.env.local:
//   VITE_WAYPOINT_MOCK=true
//
// Gated on import.meta.env.DEV so it can never leak into a production build.
export const WAYPOINT_MOCK_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_WAYPOINT_MOCK === 'true';

// Fake "my position": a fixed virtual point used as the origin of the
// as-the-crow-flies line (distance / bearing are computed from it).
export const MOCK_USER_LOCATION = { lat: 45.111, lng: 5.5244 };
