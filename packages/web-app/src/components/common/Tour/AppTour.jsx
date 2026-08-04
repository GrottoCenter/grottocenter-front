import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { TourProvider, useTour } from '@reactour/tour';
import TourTooltip from './TourTooltip';
import DontShowContext from './DontShowContext';

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

  const dontShowValue = useMemo(
    () => ({ dontShowAgain, setDontShowAgain }),
    [dontShowAgain]
  );

  return (
    <DontShowContext.Provider value={dontShowValue}>
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
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      selector: PropTypes.string.isRequired,
      // `title` is a custom field TourTooltip reads; @reactour has none.
      title: PropTypes.string,
      content: PropTypes.node,
      position: PropTypes.oneOf(['top', 'right', 'bottom', 'left', 'center'])
    })
  ).isRequired,
  onEnd: PropTypes.func.isRequired
};

export default AppTour;
