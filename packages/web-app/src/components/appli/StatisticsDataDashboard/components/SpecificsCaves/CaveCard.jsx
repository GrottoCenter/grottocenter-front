import React from 'react';
import PropTypes from 'prop-types';
import { alpha, styled } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';
import { useSelector } from 'react-redux';

const StyledBox = styled(Box)`
  padding: 15px;
  border-radius: 20px;
  margin: 0 20px;
  margin-bottom: 5px;
  cursor: pointer;
`;

const BoldTypography = styled(Typography)`
  font-weight: 500;
`;

const CaveCard = ({ idCave, nameCave, numberData, text, backgroundColor }) => {
  const locale = useSelector(state => state.intl);

  return (
    <StyledBox
      bgcolor={alpha(backgroundColor, 0.6)}
      onClick={() => window.open(`/ui/caves/${idCave}`, '_blank')}>
      <Box style={{ display: 'flex' }}>
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
