import React from 'react';
import PropTypes from 'prop-types';
import { propOr } from 'ramda';
import { Typography } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';

import Layout from '../../common/Layouts/Fixed/FixedContent';

import BadgesSection from './BadgesSection';
import Details from './Details';
import RelatedCaves from './RelatedCaves';
import {
  CaverPropTypes,
  EntrancePropTypes,
  NetworkPropTypes
} from './propTypes';

const Organization = ({ error, isLoading, organization }) => {
  const { formatMessage } = useIntl();

  if (error) {
    return (
      <Typography>
        {formatMessage({
          id:
            'Error, the organization data you are looking for is not available.'
        })}
      </Typography>
    );
  }

  return (
    <Layout
      avatar={
        isLoading ? (
          <Skeleton>
            <BadgesSection />
          </Skeleton>
        ) : (
          <BadgesSection
            nbCavers={propOr([], 'cavers', organization).length}
            nbExploredEntrances={
              propOr([], 'exploredEntrances', organization).length
            }
            nbExploredNetworks={
              propOr([], 'exploredNetworks', organization).length
            }
          />
        )
      }
      subheader={
        isLoading ? (
          <Skeleton />
        ) : (
          organization && (
            <>
              {organization.yearBirth &&
                `${formatMessage({ id: 'Since' })} ${organization.yearBirth}`}
              {organization.yearBirth &&
                organization.isOfficialPartner &&
                ` - `}
              {organization.isOfficialPartner && (
                <>{formatMessage({ id: 'Official partner' })}</>
              )}
            </>
          )
        )
      }
      title={
        organization?.name ||
        formatMessage({ id: 'Loading organization data...' })
      }
      content={
        <>
          {isLoading && (
            <>
              <Skeleton height={150} /> {/* Details Skeleton */}
              <Skeleton height={150} /> {/* Explored data Skeleton */}
              <Skeleton height={150} /> {/* Partner data Skeleton */}
            </>
          )}
          {organization && (
            <>
              <Details
                address={organization.address}
                city={organization.city}
                country={organization.country}
                county={organization.county}
                customMessage={organization.customMessage}
                mail={organization.mail}
                postalCode={organization.postalCode}
                region={organization.region}
                village={organization.village}
              />

              <hr />

              <RelatedCaves
                exploredEntrances={organization.exploredEntrances}
                exploredNetworks={organization.exploredNetworks}
                partnerEntrances={organization.partnerEntrances}
                partnerNetworks={organization.partnerNetworks}
              />
            </>
          )}
        </>
      }
    />
  );
};

Organization.propTypes = {
  error: PropTypes.shape({}),
  isLoading: PropTypes.bool.isRequired,
  organization: PropTypes.shape({
    address: PropTypes.string,
    mail: PropTypes.string,
    customMessage: PropTypes.string,
    cavers: PropTypes.arrayOf(CaverPropTypes),
    city: PropTypes.string,
    country: PropTypes.string,
    county: PropTypes.string,
    exploredEntrances: PropTypes.arrayOf(EntrancePropTypes),
    exploredNetworks: PropTypes.arrayOf(NetworkPropTypes),
    isOfficialPartner: PropTypes.bool,
    name: PropTypes.string.isRequired,
    region: PropTypes.string,
    partnerEntrances: PropTypes.arrayOf(EntrancePropTypes),
    partnerNetworks: PropTypes.arrayOf(NetworkPropTypes),
    postalCode: PropTypes.string,
    village: PropTypes.string,
    yearBirth: PropTypes.number
  })
};

export default Organization;
