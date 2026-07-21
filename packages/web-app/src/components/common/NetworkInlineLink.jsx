import React from 'react';
import PropTypes from 'prop-types';
import { Link as MuiLink } from '@mui/material';
import { networkIcon } from '../../assets/icons';
import AppLink from './AppLink';

// An inline "network" link (icon + name) meant to be dropped into a
// FormattedMessage's `values` as a named placeholder, e.g.:
//   <FormattedMessage id="... {networkLink} ..." values={{ networkLink: <NetworkInlineLink .../> }} />
const NetworkInlineLink = ({ caveId, label, size = 16, variant = 'body2' }) => (
  <MuiLink
    component={AppLink}
    to={`/ui/caves/${caveId}`}
    openInNewTabDesktop
    variant={variant}
    sx={{ verticalAlign: 'baseline', display: 'inline' }}
  >
    <img
      src={networkIcon}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ verticalAlign: 'middle', marginRight: '2px' }}
    />
    {label}
  </MuiLink>
);

NetworkInlineLink.propTypes = {
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  size: PropTypes.number,
  variant: PropTypes.string
};

export default NetworkInlineLink;
