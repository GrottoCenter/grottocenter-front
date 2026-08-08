import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Tooltip } from '@mui/material';
import { useOnlineStatus } from '../../hooks';

/**
 * Explains why an action is unavailable while offline.
 *
 * Wrap a control that needs the network and pass `disabled` down yourself —
 * this only adds the explanation, so callers keep control over their own
 * disabled logic:
 *
 *   <OfflineDisabled>
 *     <Button disabled={isOffline || isSaving}>Save</Button>
 *   </OfflineDisabled>
 *
 * Rule: disable, never hide. A control that vanishes shifts the layout and
 * leaves the user wondering what happened to it.
 *
 * The <span> wrapper is required, not cosmetic: MUI sets `pointer-events: none`
 * on a disabled button, so the Tooltip would never receive the hover that
 * triggers it.
 */
const OfflineDisabled = ({ children, title = null }) => {
  const isOnline = useOnlineStatus();
  const { formatMessage } = useIntl();

  if (isOnline) return children;

  return (
    <Tooltip title={title ?? formatMessage({ id: 'offlineActionUnavailable' })}>
      {/* inline-flex so the wrapper is layout-neutral: a plain inline <span>
          would break button groups and flex rows it gets dropped into. */}
      <span style={{ display: 'inline-flex' }}>{children}</span>
    </Tooltip>
  );
};

OfflineDisabled.propTypes = {
  children: PropTypes.node.isRequired,
  // Overrides the generic wording when a screen can say something better.
  title: PropTypes.string
};

export default OfflineDisabled;
