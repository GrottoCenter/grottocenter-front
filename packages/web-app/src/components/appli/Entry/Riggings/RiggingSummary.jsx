import React from 'react';
import { useIntl } from 'react-intl';
import { Chip, Stack, Tooltip } from '@mui/material';
import PropTypes from 'prop-types';
import { ObstaclePropTypes } from '../../../../types/entrance.type';
import { parseRopeLengths } from '../../../../utils/ropeLength';
import { ropeIcon } from '../../../../assets/icons';

const RiggingSummary = ({ obstacles }) => {
  const { formatMessage, formatNumber } = useIntl();
  const { total, unparsedCount } = parseRopeLengths(obstacles.map(o => o.rope));

  return (
    <Stack direction="row" spacing={1}>
      <Chip
        size="small"
        variant="outlined"
        label={formatMessage(
          {
            id: '{count, plural, one {# obstacle} other {# obstacles}}'
          },
          { count: obstacles.length }
        )}
      />
      {total > 0 && (
        <Tooltip
          title={formatMessage({
            id: 'Approximate total rope length, automatically calculated from rope cells'
          })}>
          <Chip
            size="small"
            variant="outlined"
            icon={
              <img
                src={ropeIcon}
                alt=""
                aria-hidden="true"
                width={18}
                height={18}
              />
            }
            label={`${unparsedCount > 0 ? '~' : ''}${formatNumber(total)} m`}
          />
        </Tooltip>
      )}
    </Stack>
  );
};

RiggingSummary.propTypes = {
  obstacles: PropTypes.arrayOf(ObstaclePropTypes).isRequired
};

export default RiggingSummary;
