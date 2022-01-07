import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { Typography } from '@material-ui/core';
import styled from 'styled-components';
import EmailIcon from '@material-ui/icons/Email';
import LocationIcon from '@material-ui/icons/LocationOn';

const ContentWrapper = styled.div`
  display: flex;
  padding: ${({ theme }) => theme.spacing(1)}px;
`;

const StyledLocationIcon = styled(LocationIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const StyledEmailIcon = styled(EmailIcon)`
  margin-right: ${({ theme }) => theme.spacing(1)}px;
`;

const Details = ({
  address,
  city,
  country,
  county,
  customMessage,
  mail,
  postalCode,
  region,
  village
}) => {
  return (
    <>
      <ContentWrapper>
        <StyledLocationIcon color="primary" />
        <Typography>
          {!isNil(country) && ` - ${country}`}
          {!isNil(region) && ` - ${region}`}
          {!isNil(county) && ` - ${county}`}
          {!isNil(city) && ` - ${city}`}
          {!isNil(village) && ` - ${village}`}
          {!isNil(postalCode) && ` - ${postalCode}`}
          {!isNil(address) && ` - ${address}`}
        </Typography>
      </ContentWrapper>
      {mail && (
        <ContentWrapper>
          <StyledEmailIcon color="primary" />
          <Typography>{mail}</Typography>
        </ContentWrapper>
      )}
      {customMessage && (
        <ContentWrapper>
          <Typography>{customMessage}</Typography>
        </ContentWrapper>
      )}
    </>
  );
};

Details.propTypes = {
  address: PropTypes.string,
  mail: PropTypes.string,
  customMessage: PropTypes.string,
  city: PropTypes.string,
  country: PropTypes.string,
  county: PropTypes.string,
  region: PropTypes.string,
  postalCode: PropTypes.string,
  village: PropTypes.string
};

export default Details;
