import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  ListItem,
  ListItemText,
  CircularProgress,
  Box,
  Typography,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 350px;
  margin: 5px;
`;

const CircularProgressWithLabel = ({ value, color }) => (
  <Box
    position="relative"
    display="inline-flex"
    style={{ marginRight: '10px' }}>
    <Box style={{ display: 'flex' }}>
      <CircularProgress
        variant="determinate"
        value={100}
        style={{
          color: 'lightGray',
          position: 'absolute'
        }}
      />
      <CircularProgress variant="determinate" value={value} style={{ color }} />
    </Box>
    <Box
      top={0}
      left={0}
      bottom={0}
      right={0}
      position="absolute"
      display="flex"
      alignItems="center"
      justifyContent="center"
      style={{ color }}>
      <Typography variant="caption" component="div" style={{ fontWeight: 700 }}>
        {value}
      </Typography>
    </Box>
  </Box>
);

CircularProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate variant.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
  color: PropTypes.node
};

const EntranceListItem = ({ entrance }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  // manage color associated with the value of the data quality
  const getColor = value => {
    if (value >= 70) {
      return theme.palette.successColor;
    }
    if (value >= 40) {
      return theme.palette.secondary.main;
    }
    return theme.palette.errorColor;
  };

  return (
    <StyledListItem
      button
      onClick={() =>
        window.open(`/ui/entrances/${entrance.id_entrance}`, '_blank')
      }>
      <CircularProgressWithLabel
        value={entrance.data_quality}
        color={getColor(entrance.data_quality)}
      />
      <ListItemText
        primary={
          entrance.name ? (
            entrance.name
          ) : (
            <i>{formatMessage({ id: 'no name' })}</i>
          )
        }
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }} // Multiple lines text
      />
    </StyledListItem>
  );
};

EntranceListItem.propTypes = {
  entrance: PropTypes.shape({
    name: PropTypes.string,
    id_entrance: PropTypes.number,
    data_quality: PropTypes.number
  })
};

export default EntranceListItem;
