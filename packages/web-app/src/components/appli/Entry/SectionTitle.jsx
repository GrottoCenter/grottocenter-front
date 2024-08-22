import PropTypes from 'prop-types';
import React from 'react';
import { Typography, Box } from '@mui/material';
import { useIntl } from 'react-intl';

const SectionTitle = ({ title, isDeleted = false, marginBotton = 2 }) => {
  const { formatMessage } = useIntl();

  if (!isDeleted)
    return (
      <Box mb={marginBotton}>
        <Typography variant="h4">{title}&nbsp;</Typography>
      </Box>
    );
  return (
    <Box mb={2}>
      <Typography
        variant="h4"
        noWrap
        sx={{
          display: 'inline-block',
          textTransform: 'uppercase',
          fontWeight: 'bold'
        }}>
        [{formatMessage({ id: 'deleted' })}]&nbsp;
      </Typography>
      <Typography
        variant="h4"
        noWrap
        sx={{
          fontStyle: 'italic',
          textDecoration: 'line-through',
          display: 'inline-block',
          fontWeight: 'normal'
        }}>
        {title}&nbsp;
      </Typography>
    </Box>
  );
};

export default SectionTitle;

SectionTitle.propTypes = {
  title: PropTypes.string.isRequired,
  isDeleted: PropTypes.bool,
  marginBotton: PropTypes.number
};
