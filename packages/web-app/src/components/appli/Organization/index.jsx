import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import BadgesSection from './BadgesSection';
import Details from './Details';
import { GrottoFullPropTypes } from '../../../types/grotto.type';
import Alert from '../../common/Alert';
import { usePermissions } from '../../../hooks';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';
import { deleteOrganization } from '../../../actions/Organization/DeleteOrganization';
import { restoreOrganization } from '../../../actions/Organization/RestoreOrganization';
import { joinOrganization } from '../../../actions/Organization/JoinOrganization';
import { leaveOrganization } from '../../../actions/Organization/LeaveOrganization';
import { fetchOrganization } from '../../../actions/Organization/GetOrganization';

const Organization = ({ error, isLoading, organization }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const { organizationId } = useParams();
  const authState = useSelector(state => state.login);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinLeaveError, setJoinLeaveError] = useState(null);

  const currentUserId = authState?.authTokenDecoded?.id;

  const isMember = useMemo(
    () =>
      permissions.isAuth &&
      organization?.cavers?.some(caver => caver.id === currentUserId),
    [permissions.isAuth, organization?.cavers, currentUserId]
  );

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

  const handleJoinLeave = async () => {
    if (!currentUserId) return;
    setIsJoining(true);
    setJoinLeaveError(null);
    try {
      if (isMember) {
        await dispatch(leaveOrganization(currentUserId, organizationId));
      } else {
        await dispatch(joinOrganization(currentUserId, organizationId));
      }
      // Refresh organization data
      dispatch(fetchOrganization(organizationId));
    } catch (err) {
      console.error('Error joining/leaving organization:', err);
      setJoinLeaveError(err.message || 'An error occurred');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRemoveMember = async userId => {
    setJoinLeaveError(null);
    try {
      await dispatch(leaveOrganization(userId, organizationId));
      dispatch(fetchOrganization(organizationId));
    } catch (err) {
      console.error('Error removing member:', err);
      setJoinLeaveError(err.message || 'An error occurred');
    }
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
              <EntitiesList
                type="person"
                entites={organization.cavers}
                title={formatMessage({ id: 'Members (former members)' })}
                hasDivider
                onItemRemove={permissions.isAdmin ? handleRemoveMember : null}
                actionButton={
                  permissions.isAuth && (
                    <>
                      <Tooltip
                        title={formatMessage({
                          id: isMember
                            ? 'Leave organization'
                            : 'Join organization'
                        })}>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={handleJoinLeave}
                          disabled={isJoining}
                          startIcon={
                            isMember ? <PersonRemoveIcon /> : <PersonAddIcon />
                          }>
                          {isMember
                            ? formatMessage({ id: 'Leave organization' })
                            : formatMessage({ id: 'Join organization' })}
                        </Button>
                      </Tooltip>
                      {joinLeaveError && (
                        <Alert severity="error" title={joinLeaveError} />
                      )}
                    </>
                  )
                }
              />
              <DocumentsList
                title={formatMessage({ id: 'Collections' })}
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
              <EntitiesList
                type="entrance"
                entites={organization.exploredEntrances}
                title={formatMessage({ id: 'Explored entrances' })}
                hasDivider
              />
              <EntitiesList
                type="cave"
                entites={organization.exploredNetworks}
                title={formatMessage({ id: 'Explored networks' })}
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
