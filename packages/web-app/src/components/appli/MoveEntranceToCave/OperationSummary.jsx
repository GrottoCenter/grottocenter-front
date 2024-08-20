import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { useIntl } from 'react-intl';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

import { Property } from '../../common/Properties';
import { CaveType, EntranceType } from './types';

const OperationSummary = ({ entrance, isLinkedToANetwork, newCave }) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="flex-start">
      <Box>
        <Property
          label={formatMessage({
            id: isLinkedToANetwork ? 'Previous network' : 'Previous cave'
          })}
          url={entrance.cave ? `/ui/caves/${entrance.cave?.id}` : null}
          value={entrance.cave?.name ?? formatMessage({ id: 'none' })}
        />
      </Box>
      <Box mx={4}>
        <KeyboardArrowRightIcon fontSize="large" />
      </Box>
      <Box>
        <Property
          label={formatMessage({ id: 'New cave or network' })}
          url={newCave?.id && `/ui/caves/${newCave.id}`}
          value={
            newCave?.name
              ? newCave.name
              : formatMessage({
                  id: 'Select a cave or network using the search bar below.'
                })
          }
        />
      </Box>
    </Box>
  );
};

OperationSummary.propTypes = {
  entrance: EntranceType,
  isLinkedToANetwork: PropTypes.bool.isRequired,
  newCave: CaveType
};

export default OperationSummary;
