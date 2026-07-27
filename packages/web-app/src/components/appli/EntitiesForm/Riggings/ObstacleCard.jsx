import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Card, Stack, Typography } from '@mui/material';

import ObstacleField from './ObstacleField';
import ObstacleRowActions from './ObstacleRowActions';
import ColumnLegend from '../../Entry/Riggings/ColumnLegend';

const LegendSectionsShape = PropTypes.arrayOf(
  PropTypes.shape({
    titleKey: PropTypes.string.isRequired,
    items: PropTypes.array.isRequired
  })
);

const ObstacleCard = ({
  control,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  autoFocus = false,
  legendSections
}) => {
  const { formatMessage } = useIntl();

  return (
    <Card variant="outlined" sx={{
      px: 0.5
    }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 0.25
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="caption" fontWeight="medium">
            {`${formatMessage({ id: 'Obstacle' })} ${index + 1}`}
          </Typography>
          {legendSections && (
            <ColumnLegend label="Notation legends" sections={legendSections} />
          )}
        </Box>
        <ObstacleRowActions
          isFirst={isFirst}
          isLast={isLast}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
          orientation="horizontal"
        />
      </Box>
      <Stack spacing={0.25}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ObstacleField
              control={control}
              index={index}
              field="obstacle"
              showLabel
              autoFocus={autoFocus}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <ObstacleField
              control={control}
              index={index}
              field="rope"
              showLabel
            />
          </Box>
        </Box>
        <ObstacleField
          control={control}
          index={index}
          field="anchor"
          showLabel
        />
        <ObstacleField
          control={control}
          index={index}
          field="observation"
          showLabel
        />
      </Stack>
    </Card>
  );
};

ObstacleCard.propTypes = {
  control: PropTypes.shape({}).isRequired,
  index: PropTypes.number.isRequired,
  isFirst: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  autoFocus: PropTypes.bool,
  legendSections: LegendSectionsShape
};

export default ObstacleCard;
