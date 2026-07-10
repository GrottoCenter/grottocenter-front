import React from 'react';
import PropTypes from 'prop-types';
import { Box, Link as MuiLink } from '@mui/material';
import CustomIcon from './CustomIcon';
import { useOpenLink } from '../../hooks';

// An inline "network" link (icon + name) meant to be dropped into a
// FormattedMessage's `values` as a named placeholder, e.g.:
//   <FormattedMessage id="... {networkLink} ..." values={{ networkLink: <NetworkInlineLink .../> }} />
const NetworkInlineLink = ({ caveId, label, size = 16, variant = 'body2' }) => {
  const openLink = useOpenLink();
  const goToCave = () => openLink(`/ui/caves/${caveId}`);

  // A real <button> would establish its own inline-block box and break the
  // surrounding sentence onto its own line. A <span> with a button role stays
  // part of the normal text flow, like any other inline link.
  return (
    <MuiLink
      component="span"
      variant={variant}
      role="button"
      tabIndex={0}
      onClick={goToCave}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goToCave();
        }
      }}
      sx={{ cursor: 'pointer', verticalAlign: 'baseline' }}
    >
      <Box
        component="span"
        sx={{
          display: 'inline-block',
          verticalAlign: 'middle',
          mr: '2px'
        }}
      >
        <CustomIcon type="network" size={size} />
      </Box>
      {label}
    </MuiLink>
  );
};

NetworkInlineLink.propTypes = {
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  label: PropTypes.string.isRequired,
  size: PropTypes.number,
  variant: PropTypes.string
};

export default NetworkInlineLink;
