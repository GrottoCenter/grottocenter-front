import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Alert } from '@mui/material';
import CustomControl from '../common/CustomControl';

/**
 * Explains an empty map at detail zoom while offline.
 *
 * Above MARKERS_LIMIT the map draws real markers fetched per tile. Those tiles
 * are cached by the service worker, but only for areas already visited online —
 * so panning to a new area offline legitimately yields nothing. Without a word,
 * an empty map reads as "there are no caves here", which is the opposite of the
 * truth.
 *
 * Rendered only when there is genuinely nothing to show: as soon as a single
 * marker is on screen, the map speaks for itself and the notice would be noise.
 */
const OfflineDetailNotice = ({ show }) => {
  const { formatMessage } = useIntl();

  if (!show) return null;

  return (
    <CustomControl position="bottomleft" useLeafletControl>
      <Alert severity="info" sx={{ maxWidth: 320, m: 1 }}>
        {formatMessage({ id: 'offlineMapDetailUnavailable' })}
      </Alert>
    </CustomControl>
  );
};

OfflineDetailNotice.propTypes = {
  show: PropTypes.bool.isRequired
};

export default OfflineDetailNotice;
