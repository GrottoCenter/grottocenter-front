import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import AppTour from '../../Tour/AppTour';

const MapTour = ({ run, onEnd }) => {
  const { formatMessage } = useIntl();

  const steps = useMemo(
    () => [
      {
        selector: '[data-tour="data-control-toggle"]',
        title: formatMessage({ id: 'Tour - Data control' }),
        content: formatMessage({ id: 'Tour - Data control description' }),
        position: 'right'
      },
      {
        selector: '.leaflet-control-layers a.leaflet-control-layers-toggle',
        title: formatMessage({ id: 'Tour - Map layers' }),
        content: formatMessage({ id: 'Tour - Map layers description' }),
        position: 'left'
      }
    ],
    [formatMessage]
  );

  return <AppTour run={run} steps={steps} onEnd={onEnd} />;
};

MapTour.propTypes = {
  run: PropTypes.bool.isRequired,
  onEnd: PropTypes.func.isRequired
};

export default MapTour;
