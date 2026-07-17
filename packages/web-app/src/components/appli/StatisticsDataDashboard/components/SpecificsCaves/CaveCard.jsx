import React from 'react';
import PropTypes from 'prop-types';
import { alpha, styled } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';
import { useSelector } from 'react-redux';
import AppLink from '../../../../common/AppLink';

const StyledBox = styled(AppLink)`
  padding: 12px 16px;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: filter 0.15s ease;
  &:hover {
    filter: brightness(0.93);
  }
`;

const CaveCard = ({ idCave, nameCave, numberData, text, backgroundColor }) => {
  const locale = useSelector(state => state.intl);

  return (
    <StyledBox
      bgcolor={alpha(backgroundColor, 0.75)}
      to={`/ui/caves/${idCave}`}
      openInNewTabDesktop>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
        <Typography variant="h4" fontWeight={700} noWrap>
          {numberData.toLocaleString(locale)} m
        </Typography>
      </Box>
      <Typography variant="body2" fontWeight={600} noWrap>{nameCave}</Typography>
      <Typography variant="caption" sx={{ opacity: 0.85 }}>{text}</Typography>
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
