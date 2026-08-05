import { createContext } from 'react';

// Kept in its own module: AppTour provides it and TourTooltip consumes it,
// so holding it in either one would create an import cycle.
const DontShowContext = createContext({
  dontShowAgain: false,
  setDontShowAgain: () => {}
});

export default DontShowContext;
