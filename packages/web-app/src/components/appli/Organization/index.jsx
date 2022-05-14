import React from 'react';
import PropTypes from 'prop-types';
import { propOr } from 'ramda';
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
import UsersList from '../../common/UsersList/UsersList';
import Alert from '../../common/Alert';
import DocumentsList from '../../common/DocumentsList/DocumentsList';

const Organization = ({ error, isLoading, organization, onEdit, canEdit }) => {
  const { formatMessage } = useIntl();

  let title = '';
  if (organization?.name) {
    title = organization.name;
  } else if (!error) {
    title = formatMessage({ id: 'Loading organization data...' });
  }

  let position = [];
  if (organization?.latitude && organization?.longitude) {
    position = [organization?.latitude, organization?.longitude];
  }

  return (
    <Layout
      avatar={
        isLoading ? (
          <Skeleton>
            <BadgesSection />
          </Skeleton>
        ) : (
          <>
            {!error && (
              <BadgesSection
                nbCavers={propOr([], 'cavers', organization).length}
                nbExploredEntrances={
                  propOr([], 'exploredEntrances', organization).length
                }
                nbExploredNetworks={
                  propOr([], 'exploredNetworks', organization).length
                }
              />
            )}
          </>
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
      title={title}
      content={
        <>
          {isLoading && (
            <>
              <Skeleton height={150} /> {/* Details Skeleton */}
              <Skeleton height={100} /> {/* Members Skeleton */}
              <Skeleton height={150} /> {/* Explored data Skeleton */}
              <Skeleton height={150} /> {/* Partner data Skeleton */}
            </>
          )}
          {error && (
            <Alert
              title={formatMessage({
                id:
                  'Error, the organization data you are looking for is not available.'
              })}
              severity="error"
            />
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
                position={position}
                organization={organization}
                canEdit={canEdit}
                onEdit={onEdit}
              />

              <hr />
              <UsersList
                users={organization.cavers}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This organization has no members yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Members' })}
              />
              <hr />
              <DocumentsList
                docs={organization.documents.map(doc => ({
                  ...doc,
                  title: doc.titles[0].text
                }))}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This organization has no documents listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Documents' })}
              />
              <hr />

              <RelatedCaves
                exploredEntrances={organization.exploredEntrances}
                exploredNetworks={organization.exploredNetworks}
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
    postalCode: PropTypes.string,
    village: PropTypes.string,
    yearBirth: PropTypes.number,
    longitude: PropTypes.number,
    latitude: PropTypes.number,
    documents: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  onEdit: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};

export default Organization;
