import React from 'react';
import PropTypes from 'prop-types';
import { propOr } from 'ramda';
import {
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Typography
} from '@material-ui/core';
import { useIntl } from 'react-intl';

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
    <>
      {isLoading && <CircularProgress />}
      {organization && (
        <Card>
          <CardHeader
            avatar={
              <BadgesSection
                nbCavers={propOr([], 'cavers', organization).length}
                nbExploredEntrances={
                  propOr([], 'exploredEntrances', organization).length
                }
                nbExploredNetworks={
                  propOr([], 'exploredNetworks', organization).length
                }
              />
            }
            title={
              <Typography variant="h1" color="secondary">
                {organization.name}
              </Typography>
            }
            subheader={
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
            }
          />
          <CardContent>
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
              partneredEntrances={organization.partneredEntrances}
              partneredNetworks={organization.partneredNetworks}
            />
          </CardContent>
        </Card>
      )}
    </>
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
    partneredEntrances: PropTypes.arrayOf(EntrancePropTypes),
    partneredNetworks: PropTypes.arrayOf(NetworkPropTypes),
    postalCode: PropTypes.string,
    village: PropTypes.string,
    yearBirth: PropTypes.number
  })
};

Organization.defaultProps = {
  organization: undefined
};

export default Organization;
