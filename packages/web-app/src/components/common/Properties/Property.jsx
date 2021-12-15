import { isNil } from 'ramda';
import { Box, Typography } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

export const StyledTypography = styled(Typography)`
  margin-left: ${({ theme, variant }) =>
    variant === 'caption' && theme.spacing(2)}px;
`;

export const PropertyWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-basis: 33%;
  padding: ${({ theme }) => theme.spacing(1)}px;
  & > svg {
    margin-right: ${({ theme }) => theme.spacing(1)}px;
  }
`;

const Title = styled(Typography)`
  color: ${({ theme }) => theme.palette.secondaryTextColor};
`;

const IconWrapper = styled(Box)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const Property = ({
  loading = false,
  label,
  value,
  icon,
  secondary = false
}) => (
  <PropertyWrapper>
    {!isNil(icon) && <IconWrapper display="flex">{icon}</IconWrapper>}
    {loading ? (
      <Skeleton variant="text" width="100%" />
    ) : (
      <Box display="flex" flexDirection="column">
        <Title variant="caption">{label}</Title>
        <StyledTypography variant={secondary ? 'body2' : 'body1'}>
          {value || ''}
        </StyledTypography>
      </Box>
    )}
  </PropertyWrapper>
);

Property.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  icon: PropTypes.object,
  loading: PropTypes.bool,
  label: PropTypes.string,
  secondary: PropTypes.bool,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default Property;
