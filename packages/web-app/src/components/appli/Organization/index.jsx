import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import BadgesSection from './BadgesSection';
import Details from './Details';
import RelatedCaves from './RelatedCaves';
import { GrottoFullPropTypes } from '../../../types/grotto.type';
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
  const navigate = useNavigate();
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
      navigate(`/ui/organizations/${organizationId}/edit`);
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
    if (isPermanent) navigate('/', { replace: true });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreOrganization({ id: organizationId }));
  };

  const isActionLoading = wantedDeletedState !== organization?.isDeleted;

  return (
    <FixedContent
      onEdit={!error ? onEdit : null}
      onDelete={!error ? onDelete : null}
      avatar={
        isLoading ? (
          <Skeleton />
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
      title={isLoading ? <Skeleton /> : (organization?.name ?? '')}
      content={
        <>
          {isLoading && !error && (
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
              )}
              <DeleteConfirmationDialog
                entityType={DELETED_ENTITIES.organization}
                isOpen={isDeleteConfirmationOpen}
                isLoading={isActionLoading}
                isPermanent={isDeleteConfirmationPermanent}
                onClose={() => setIsDeleteConfirmationOpen(false)}
                onConfirmation={entity => {
                  onDeletePress(entity?.id, isDeleteConfirmationPermanent);
                }}
              />
              <Details organization={organization} />

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
  organization: GrottoFullPropTypes
};

export default Organization;
