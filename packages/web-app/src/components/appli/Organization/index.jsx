import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { Box, Card, Link, Stack, Typography } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HandshakeIcon from '@mui/icons-material/Handshake';
import StandardDialog from '../../common/StandardDialog';
import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';
import Details from './Details';
import { GrottoFullPropTypes } from '../../../types/grotto.type';
import Alert from '../../common/Alert';
import { usePermissions } from '../../../hooks';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import RelatedCaves from '../../common/RelatedCaves/RelatedCaves';
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
  const { isAuth, isAdmin, isModerator } = usePermissions();
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
  const [isCaveSearchVisible, setIsCaveSearchVisible] = useState(false);
  const [pendingRemoveMember, setPendingRemoveMember] = useState(null);

  const currentUserId = authState?.authTokenDecoded?.id;

  const isMember = useMemo(
    () =>
      isAuth && organization?.cavers?.some(caver => caver.id === currentUserId),
    [isAuth, organization?.cavers, currentUserId]
  );
  const canManageCaves = isAdmin || isModerator || isMember;

  useEffect(() => {
    if (organization) setWantedDeletedState(organization.isDeleted);
  }, [organization]);

  let onEdit = null;
  let onDelete = null;
  if (isAuth && !organization?.isDeleted) {
    onEdit = () => {
      navigate(`/ui/organizations/${organizationId}/edit`);
    };
    if (isModerator) {
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

  const handleRefresh = useCallback(() => {
    dispatch(fetchOrganization(organizationId));
  }, [dispatch, organizationId]);

  const handleJoinLeave = useCallback(async () => {
    if (!currentUserId) return;
    setIsJoining(true);
    setJoinLeaveError(null);
    try {
      if (isMember) {
        await dispatch(leaveOrganization(currentUserId, organizationId));
      } else {
        await dispatch(joinOrganization(currentUserId, organizationId));
      }
      dispatch(fetchOrganization(organizationId));
    } catch (err) {
      console.error('Error joining/leaving organization:', err);
      setJoinLeaveError(err.message || 'An error occurred');
    } finally {
      setIsJoining(false);
    }
  }, [dispatch, isMember, currentUserId, organizationId]);

  const requestRemoveMember = useCallback(userId => {
    const caver = (organization?.cavers ?? []).find(c => c.id === userId);
    setPendingRemoveMember({ id: userId, label: caver?.nickname });
  }, [organization?.cavers]);

  const handleConfirmRemoveMember = useCallback(async () => {
    if (!pendingRemoveMember) return;
    const { id } = pendingRemoveMember;
    setPendingRemoveMember(null);
    setJoinLeaveError(null);
    try {
      await dispatch(leaveOrganization(id, organizationId));
      dispatch(fetchOrganization(organizationId));
    } catch (err) {
      console.error('Error removing member:', err);
      setJoinLeaveError(err.message || 'An error occurred');
    }
  }, [dispatch, pendingRemoveMember, organizationId]);

  const isActionLoading = wantedDeletedState !== organization?.isDeleted;

  const nbDocuments = (organization?.documents ?? []).length;
  const nbNetworks = (organization?.exploredNetworks ?? []).length;
  const nbEntrances = (organization?.exploredEntrances ?? []).length;

  return (
    <FixedLayout>
      {organization && (
        <FixedContent
          displayShare
          icon={<CustomIcon type="organization" />}
          onEdit={!error ? onEdit : null}
          onDelete={!error ? onDelete : null}
          subheader={
            (organization.country ||
              organization.yearBirth ||
              organization.isOfficialPartner) && (
              <Stack
                direction="row"
                divider={
                  <Typography
                    component="span"
                    color="text.secondary"
                    sx={{ mx: 1 }}>
                    ·
                  </Typography>
                }
                alignItems="center"
                flexWrap="wrap"
                sx={{ fontSize: { xs: '1.2rem', md: '1.7rem' } }}>
                {organization.country && (
                  <Link
                    component={RouterLink}
                    to={`/ui/countries/${organization.country}`}
                    underline="hover"
                    color="inherit"
                    sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CustomIcon type="country" size={16} />
                    {organization.country}
                  </Link>
                )}
                {organization.yearBirth && (
                  <Typography
                    component="span"
                    sx={{ fontSize: 'inherit', color: 'inherit' }}>
                    {`${formatMessage({ id: 'Since' })} ${organization.yearBirth}`}
                  </Typography>
                )}
                {organization.isOfficialPartner && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <HandshakeIcon sx={{ fontSize: 'inherit' }} />
                    <Typography
                      component="span"
                      sx={{ fontSize: 'inherit', color: 'inherit' }}>
                      {formatMessage({ id: 'Official partner' })}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )
          }
          title={organization.name ?? ''}
          content={
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
            </>
          }
        />
      )}
      {isLoading && (
        <Card sx={{ padding: 3 }}>
          <Skeleton height={150} />
          <Skeleton height={100} />
          <Skeleton height={100} />
          <Skeleton height={100} />
        </Card>
      )}
      {error && (
        <Card sx={{ padding: 3 }}>
          <Alert
            title={formatMessage({
              id: 'Error, the organization data you are looking for is not available.'
            })}
            severity="error"
          />
        </Card>
      )}
      {organization && (
        <>
          <ScrollableContent
            anchorId="members"
            title={formatMessage({ id: 'Members or former members' })}
            count={(organization.cavers ?? []).length}
            icon={
              isAuth && (
                <Tooltip
                  title={formatMessage({
                    id: isMember ? 'Leave organization' : 'Join organization'
                  })}>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleJoinLeave}
                    disabled={isJoining}
                    startIcon={
                      isMember ? <PersonRemoveIcon /> : <PersonAddIcon />
                    }
                    sx={{ minWidth: 0 }}>
                    <Box
                      component="span"
                      sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      {isMember
                        ? formatMessage({ id: 'Leave organization' })
                        : formatMessage({ id: 'Join organization' })}
                    </Box>
                  </Button>
                </Tooltip>
              )
            }
            content={
              <>
                <EntitiesList
                  type="person"
                  entities={organization.cavers}
                  onItemRemove={isAdmin ? requestRemoveMember : null}
                  toolTipTitle={formatMessage({
                    id: 'Remove from organization'
                  })}
                  emptyMessage={
                    <Alert
                      severity="info"
                      title={formatMessage({
                        id: 'This organization has no members yet.'
                      })}
                    />
                  }
                />
                {joinLeaveError && (
                  <Alert severity="error" title={joinLeaveError} />
                )}
              </>
            }
          />
          {nbDocuments > 0 && (
            <ScrollableContent
              anchorId="documents"
              title={formatMessage({ id: 'Collections' })}
              count={nbDocuments}
              content={
                <DocumentsList
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
              }
            />
          )}
          {(nbNetworks > 0 || nbEntrances > 0 || canManageCaves) && (
            <ScrollableContent
              anchorId="related-caves"
              title={formatMessage({ id: 'Explored caves' })}
              count={nbNetworks + nbEntrances}
              icon={
                canManageCaves && (
                  <Tooltip
                    title={formatMessage({
                      id: isCaveSearchVisible
                        ? 'Cancel this search'
                        : 'Add a cave'
                    })}>
                    <Button
                      color={isCaveSearchVisible ? 'inherit' : 'secondary'}
                      variant="outlined"
                      onClick={() => setIsCaveSearchVisible(v => !v)}
                      startIcon={
                        isCaveSearchVisible ? <CancelIcon /> : <AddCircleIcon />
                      }>
                      {formatMessage({
                        id: isCaveSearchVisible ? 'Cancel' : 'Add'
                      })}
                    </Button>
                  </Tooltip>
                )
              }
              content={
                <RelatedCaves
                  exploredEntrances={organization.exploredEntrances}
                  exploredNetworks={organization.exploredNetworks}
                  entityId={organization.id}
                  isOrganization
                  canManageCaves={canManageCaves}
                  onRefresh={handleRefresh}
                  isCaveSearchVisible={isCaveSearchVisible}
                  onToggleCaveSearch={setIsCaveSearchVisible}
                />
              }
            />
          )}
        </>
      )}
      <StandardDialog
        open={!!pendingRemoveMember}
        onClose={() => setPendingRemoveMember(null)}
        fullWidth
        maxWidth="xs"
        title={formatMessage({ id: 'Remove member' })}
        actions={
          <>
            <Button onClick={() => setPendingRemoveMember(null)} variant="text">
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button onClick={handleConfirmRemoveMember} color="error" autoFocus>
              {formatMessage({ id: 'Remove' })}
            </Button>
          </>
        }>
        {formatMessage(
          { id: 'Are you sure you want to remove {name} from this organization?' },
          {
            name: (
              <Typography component="span" fontWeight={700}>
                {pendingRemoveMember?.label ?? '?'}
              </Typography>
            )
          }
        )}
      </StandardDialog>
    </FixedLayout>
  );
};

Organization.propTypes = {
  error: PropTypes.shape({}),
  isLoading: PropTypes.bool.isRequired,
  organization: GrottoFullPropTypes
};

export default Organization;
