import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
import MuiRating from '@material-ui/lab/Rating';
import StarBorderIcon from '@material-ui/icons/StarBorder';

import Translate from '../Translate';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  padding: ${({ theme }) => theme.spacing(1)}px;
`;

const Rating = ({ value, label, size }) => (
  <Wrapper>
    <Typography
      variant={size === 'small' ? 'body2' : undefined}
      color="primary"
      component="legend">
      <Translate>{label}</Translate>
    </Typography>
    <MuiRating
      size={size}
      readOnly
      name={label}
      value={value}
      precision={0.1}
      emptyIcon={<StarBorderIcon fontSize="inherit" />}
    />
  </Wrapper>
);

Rating.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'large'])
};

export default Rating;
