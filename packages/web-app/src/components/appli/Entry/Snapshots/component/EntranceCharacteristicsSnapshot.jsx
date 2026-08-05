import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';

import { Property } from '../../../../common/Properties';
import CustomIcon from '../../../../common/CustomIcon';
import { ENTRANCE_BOOLEAN_CHARACTERISTICS } from '../../../../../conf/entranceCharacteristics';

const ADDED_SX = { bgcolor: 'rgba(70, 149, 74, 0.2)', borderRadius: 1 };
const REMOVED_SX = { bgcolor: 'rgba(229, 83, 74, 0.2)', borderRadius: 1 };

// Renders the entrance boolean characteristics (hazards, restrictions, touristic
// flag) as a diff against the previous snapshot: added ones are highlighted green,
// removed ones red. Shared by the cave and network entrance snapshot variants.
const EntranceCharacteristicsSnapshot = ({ entrance, previous }) => {
  const { formatMessage } = useIntl();

  return ENTRANCE_BOOLEAN_CHARACTERISTICS.filter(({ field }) => {
    if (previous == null) return !!entrance[field];
    return !!entrance[field] || previous[field] !== entrance[field];
  }).map(({ field, label, icon }) => {
    const isAdded = previous != null && !!entrance[field] && !previous[field];
    const isRemoved = previous != null && !entrance[field] && !!previous[field];
    let diffSx;
    if (isAdded) diffSx = ADDED_SX;
    else if (isRemoved) diffSx = REMOVED_SX;
    return (
      <Box key={field} sx={diffSx}>
        <Property
          value={formatMessage({ id: label })}
          icon={<CustomIcon type={icon} />}
          secondary={!entrance[field]}
        />
      </Box>
    );
  });
};

EntranceCharacteristicsSnapshot.propTypes = {
  entrance: PropTypes.shape({}),
  previous: PropTypes.shape({})
};

export default EntranceCharacteristicsSnapshot;
