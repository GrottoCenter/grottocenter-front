import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { useParams, useHistory } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
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
import { usePermissions } from '../../../hooks';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';
import { deleteOrganization } from '../../../actions/Organization/DeleteOrganization';
import { restoreOrganization } from '../../../actions/Organization/RestoreOrganization';

const Organization = ({ error, isLoading, organization }) => {
  const { formatMessage } = useIntl();
  const history = useHistory();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const { organizationId } = useParams();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

  useEffect(() => {
    if (organization) setWantedDeletedState(organization.isDeleted);
  }, [organization]);

  let onEdit = null;
  let onDelete = null;
  if (permissions.isAuth && !organization?.isDeleted) {
    onEdit = () => {
      history.push(`/ui/organizations/${organizationId}/edit`);
    };
    if (permissions.isModerator) {
      onDelete = () => {
        setIsDeleteConfirmationPermanent(false);
        setIsDeleteConfirmationOpen(true);
      };
    }
  }

  const onDeletePress = (entityId, isPermanent) => {
    setWantedDeletedState(true);
    dispatch(deleteOrganization({ id: organizationId, entityId, isPermanent }));
    if (isPermanent) history.replace('/');
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreOrganization({ id: organizationId }));
  };

  const isActionLoading = wantedDeletedState !== organization?.isDeleted;

  let position = [];
  if (organization?.latitude && organization?.longitude) {
    position = [organization?.latitude, organization?.longitude];
  }

  return (
    <FixedContent
      onEdit={onEdit}
      onDelete={onDelete}
      avatar={
        isLoading ? (
          <Skeleton>
            <BadgesSection />
          </Skeleton>
        ) : (
          !error && (
            <BadgesSection
              nbCavers={(organization?.cavers ?? []).length}
              nbExploredEntrances={
                (organization?.exploredEntrances ?? []).length
              }
              nbExploredNetworks={(organization?.exploredNetworks ?? []).length}
            />
          )
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
      title={isLoading ? <Skeleton /> : organization?.name}
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
                id: 'Error, the organization data you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {organization && (
            <>
              {organization.isDeleted && (
                <>
                  <DeletedCard
                    entityType={DELETED_ENTITIES.organization}
                    entity={organization}
                    isLoading={isActionLoading}
                    onRestorePress={onRestorePress}
                    onPermanentDeletePress={() => {
                      setIsDeleteConfirmationPermanent(true);
                      setIsDeleteConfirmationOpen(true);
                    }}
                  />
                  <hr />
                </>
              )}
              <DeleteConfirmationDialog
                entityType={DELETED_ENTITIES.organization}
                isOpen={isDeleteConfirmationOpen}
                isLoading={isActionLoading}
                hasSearch={!isDeleteConfirmationPermanent}
                isPermanent={isDeleteConfirmationPermanent}
                onClose={() => setIsDeleteConfirmationOpen(false)}
                onConfirmation={entity => {
                  onDeletePress(entity?.id, isDeleteConfirmationPermanent);
                }}
              />
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
                title={formatMessage({ id: 'Members (former members)' })}
              />
              <hr />
              <DocumentsList
                title={formatMessage({ id: 'Documents' })}
                documents={organization.documents}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This organization has no documents listed yet.'
                    })}
                  />
                }
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
    isDeleted: PropTypes.bool,
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
  })
};

export default Organization;
