import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { TourProvider, useTour } from '@reactour/tour';
import TourTooltip from './TourTooltip';

export const DontShowContext = createContext({
  dontShowAgain: false,
  setDontShowAgain: () => {}
});

const TourSync = ({ run }) => {
  const { setIsOpen, setCurrentStep } = useTour();

  useEffect(() => {
    if (run) {
      setCurrentStep(0);
      setIsOpen(true);
    }
  }, [run, setIsOpen, setCurrentStep]);

  return null;
};

TourSync.propTypes = {
  run: PropTypes.bool.isRequired
};

const AppTour = ({ run, steps, onEnd }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dontShowRef = useRef(dontShowAgain);
  dontShowRef.current = dontShowAgain;

  const handleBeforeClose = useCallback(() => {
    onEnd(dontShowRef.current);
  }, [onEnd]);

  return (
    <DontShowContext.Provider value={{ dontShowAgain, setDontShowAgain }}>
      <TourProvider
        steps={steps}
        ContentComponent={TourTooltip}
        beforeClose={handleBeforeClose}
        defaultOpen={false}
        styles={{
          popover: base => ({
            ...base,
            backgroundColor: 'transparent',
            boxShadow: 'none',
            padding: 0,
            zIndex: 10000
          }),
          maskWrapper: base => ({ ...base, zIndex: 9999 })
        }}>
        <TourSync run={run} />
      </TourProvider>
    </DontShowContext.Provider>
  );
};

AppTour.propTypes = {
  run: PropTypes.bool.isRequired,
  steps: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEnd: PropTypes.func.isRequired
};

export default AppTour;
