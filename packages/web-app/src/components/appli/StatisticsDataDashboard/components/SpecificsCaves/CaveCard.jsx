import React from 'react';
import PropTypes from 'prop-types';
import { alpha, withStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import { useSelector } from 'react-redux';

const StyledBox = withStyles(() => ({
  root: {
    padding: '15px',
    borderRadius: '20px',
    margin: '0 20px',
    marginBottom: '5px',
    cursor: 'pointer'
  }
}))(Box);

const BoldTypography = withStyles(() => ({
  root: {
    fontWeight: 500
  }
}))(Typography);

const CaveCard = ({ idCave, nameCave, numberData, text, backgroundColor }) => {
  const locale = useSelector(state => state.intl);

  return (
    <StyledBox
      bgcolor={alpha(backgroundColor, 0.6)}
      onClick={() => window.open(`/ui/caves/${idCave}`, '_blank')}>
      <Box sx={{ display: 'flex' }}>
        <Typography variant="h4">{`${nameCave}`} &nbsp;</Typography>
        <BoldTypography variant="h4">{`${numberData.toLocaleString(
          locale
        )} m`}</BoldTypography>
      </Box>
      <Typography>{text}</Typography>
    </StyledBox>
  );
};

CaveCard.propTypes = {
  idCave: PropTypes.number,
  nameCave: PropTypes.string,
  numberData: PropTypes.number,
  text: PropTypes.string,
  backgroundColor: PropTypes.node
};

export default CaveCard;
