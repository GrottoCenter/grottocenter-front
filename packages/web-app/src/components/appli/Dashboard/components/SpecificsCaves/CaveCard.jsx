import React from 'react';
import PropTypes from 'prop-types';
import { alpha, withStyles } from '@material-ui/core/styles';
import { useIntl } from 'react-intl';
import { Typography, Box } from '@material-ui/core';

const StyledBox = withStyles(() => ({
  root: {
    padding: '15px',
    borderRadius: '20px',
    margin: '0 20px'
  }
}))(Box);

const CaveCard = ({ nameCave, numberData, text, backgroundColor }) => {
  const { formatMessage } = useIntl();

  return (
    <StyledBox bgcolor={alpha(backgroundColor, 0.6)}>
      <Typography variant="h4">{`${nameCave} [${numberData} m]`}</Typography>
      <Typography>{formatMessage({ id: text })}</Typography>
    </StyledBox>
  );
};

CaveCard.propTypes = {
  nameCave: PropTypes.string,
  numberData: PropTypes.number,
  text: PropTypes.string,
  backgroundColor: PropTypes.node
};

export default CaveCard;
