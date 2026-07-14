import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import Alert from '../../../common/Alert';
import { FormSection } from '../utils/FormContainers';
import NetworkInlineLink from '../../../common/NetworkInlineLink';

// Edit-mode network status + entry points to the (existing) move/detach flows.
// Replaces the create-time "The entrance is:" radios, which don't make sense
// once the entrance exists. The actual operations live on /ui/entrances/:id/move.
const NetworkMembershipSection = ({
  entranceId,
  isNetwork,
  networkSize,
  caveId,
  caveName
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const movePath = `/ui/entrances/${entranceId}/move`;

  return (
    <FormSection title="Network">
      <Alert
        severity="info"
        disableMargins
        content={
          isNetwork && caveId ? (
            <FormattedMessage
              id="This entrance belongs to the network {networkLink} of {count, plural, one {# entrance} other {# entrances}}."
              values={{
                count: networkSize,
                networkLink: (
                  <NetworkInlineLink
                    caveId={caveId}
                    label={caveName || formatMessage({ id: 'Network' })}
                  />
                )
              }}
            />
          ) : (
            formatMessage({
              id: 'This entrance is the only one of its cavity (no network).'
            })
          )
        }
      />
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mt: 2
        }}
      >
        <Button variant="outlined" onClick={() => navigate(movePath)}>
          {formatMessage({ id: 'Link to an existing entrance or network' })}
        </Button>
        {isNetwork && (
          <Button
            variant="outlined"
            color="error"
            onClick={() => navigate(`${movePath}?mode=detach`)}
          >
            {formatMessage({ id: 'Detach from current network' })}
          </Button>
        )}
      </Box>
    </FormSection>
  );
};

NetworkMembershipSection.propTypes = {
  entranceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  isNetwork: PropTypes.bool.isRequired,
  networkSize: PropTypes.number,
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  caveName: PropTypes.string
};

export default NetworkMembershipSection;
