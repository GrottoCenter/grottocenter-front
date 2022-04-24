import { isNil } from 'ramda';
import { Typography } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import GCLink from '../GCLink';

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

const IconWrapper = styled.div`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const ValueComponent = ({ secondary, value, url }) => {
  const valueText = (
    <StyledTypography variant={secondary ? 'body2' : 'body1'}>
      {value || ''}
    </StyledTypography>
  );
  if (url) {
    return (
      <GCLink internal href={url}>
        {valueText}
      </GCLink>
    );
  }
  return valueText;
};

ValueComponent.propTypes = {
  secondary: PropTypes.bool,
  url: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

const Property = ({
  loading = false,
  label,
  value,
  icon,
  secondary = false,
  url
}) => (
  <PropertyWrapper>
    {!isNil(icon) && <IconWrapper display="flex">{icon}</IconWrapper>}
    {loading ? (
      <Skeleton variant="text" width="100%" />
    ) : (
      // Using div instead of Box for performance purpose on the marker's popup on the map.
      // https://github.com/mui/material-ui/issues/21657#issuecomment-707140999
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Title variant="caption">{label}</Title>
        <ValueComponent secondary={secondary} url={url} value={value} />
      </div>
    )}
  </PropertyWrapper>
);

Property.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  icon: PropTypes.object,
  loading: PropTypes.bool,
  label: PropTypes.string,
  secondary: PropTypes.bool,
  url: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default Property;
