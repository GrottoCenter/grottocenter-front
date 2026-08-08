import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import { Box, Card, Stack, Typography } from '@mui/material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ShareIcon from '@mui/icons-material/Share';
import AppLink from '../../common/AppLink';
import StandardDialog from '../../common/StandardDialog';
import PageContainer from '../../common/Layouts/PageContainer';
import PageHeader from '../../common/Layouts/PageHeader';
import SectionStack from '../../common/Layouts/SectionStack';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';
import Details from './Details';
import ManagedEntitiesSection from './ManagedEntitiesSection';
import { GrottoFullPropTypes } from '../../../types/grotto.type';
import Alert from '../../common/Alert';
import FetchErrorState from '../../common/FetchErrorState';
import {
  usePermissions,
  useRefetchOnReconnect,
  useSharePage
} from '../../../hooks';
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
  const handleShare = useSharePage();

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

  useRefetchOnReconnect(handleRefresh, Boolean(error));

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

  const requestRemoveMember = useCallback(
    userId => {
      const caver = (organization?.cavers ?? []).find(c => c.id === userId);
      setPendingRemoveMember({ id: userId, label: caver?.nickname });
    },
    [organization?.cavers]
  );

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

  const actions = organization ? (
    <ResponsiveActions
      items={[
        {
          key: 'share',
          icon: <ShareIcon />,
          label: formatMessage({ id: 'Copy link' }),
          onClick: handleShare
        },
        {
          key: 'edit',
          icon: <CreateIcon />,
          label: formatMessage({ id: 'Edit properties' }),
          onClick: onEdit,
          hidden: !onEdit
        },
        {
          key: 'delete',
          icon: <DeleteIcon />,
          label: formatMessage({ id: 'Delete' }),
          onClick: onDelete,
          hidden: !onDelete,
          destructive: true
        }
      ]}
    />
  ) : null;

  const subheader =
    organization?.country ||
    organization?.yearBirth ||
    organization?.isOfficialPartner ? (
      <Stack
        direction="row"
        divider={
          <Typography component="span" color="text.secondary" sx={{ mx: 0.5 }}>
            ·
          </Typography>
        }
        alignItems="center"
        flexWrap="wrap">
        {organization.country && (
          <AppLink
            to={`/ui/countries/${organization.country}`}
            underline="hover"
            color="inherit"
            sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CustomIcon type="country" size={16} />
            {organization.country}
          </AppLink>
        )}
        {organization.yearBirth && (
          <Typography
            component="span"
            sx={{ fontSize: 'inherit', color: 'inherit' }}>
            {`${formatMessage({ id: 'Since' })} ${organization.yearBirth}`}
          </Typography>
        )}
        {organization.isOfficialPartner && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HandshakeIcon sx={{ fontSize: 'inherit' }} />
            <Typography
              component="span"
              sx={{ fontSize: 'inherit', color: 'inherit' }}>
              {formatMessage({ id: 'Official partner' })}
            </Typography>
          </Box>
        )}
      </Stack>
    ) : null;

  return (
    <PageContainer>
      <PageHeader
        title={organization?.name ?? (isLoading ? undefined : '')}
        icon={<CustomIcon type="organization" />}
        subheader={subheader}
        actions={actions}
      />
      {isLoading && (
        <SectionStack>
          <Card sx={{ p: 2 }}>
            <Skeleton height={150} />
            <Skeleton height={100} />
            <Skeleton height={100} />
            <Skeleton height={100} />
          </Card>
        </SectionStack>
      )}
      {error && (
        <SectionStack>
          <Card sx={{ p: 2 }}>
            <FetchErrorState
              error={error}
              onRetry={handleRefresh}
              messageId="Error, the organization data you are looking for is not available."
            />
          </Card>
        </SectionStack>
      )}
      {organization && (
        <SectionStack>
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
          <ScrollableContent
            content={<Details organization={organization} />}
          />
          {(organization?.countries?.length > 0 ||
            organization?.regions?.length > 0 ||
            organization?.massifs?.length > 0) && (
            <ScrollableContent
              anchorId="managed-entities"
              title={formatMessage({ id: 'Managed entities' })}
              defaultExpanded
              count={
                (organization?.countries?.length || 0) +
                (organization?.regions?.length || 0) +
                (organization?.massifs?.length || 0)
              }
              content={<ManagedEntitiesSection organization={organization} />}
            />
          )}
          <ScrollableContent
            anchorId="members"
            title={formatMessage({ id: 'Members or former members' })}
            defaultExpanded={(organization.cavers ?? []).length > 0}
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
                      content={formatMessage({
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
          <ScrollableContent
            anchorId="documents"
            defaultExpanded={nbDocuments > 0}
            title={formatMessage({ id: 'Collections' })}
            count={nbDocuments}
            content={
              <DocumentsList
                documents={organization.documents}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    content={formatMessage({
                      id: 'This organization has no documents listed yet.'
                    })}
                  />
                }
              />
            }
          />
          <ScrollableContent
            anchorId="related-caves"
            title={formatMessage({ id: 'Explored caves' })}
            defaultExpanded={nbNetworks + nbEntrances > 0}
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
        </SectionStack>
      )}
      <StandardDialog
        open={!!pendingRemoveMember}
        onClose={() => setPendingRemoveMember(null)}
        fullWidth
        maxWidth="xs"
        title={formatMessage({ id: 'Remove member' })}
        actions={
          <>
            <Button
              onClick={() => setPendingRemoveMember(null)}
              variant="outlined">
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              onClick={handleConfirmRemoveMember}
              variant="contained"
              color="error"
              autoFocus>
              {formatMessage({ id: 'Remove' })}
            </Button>
          </>
        }>
        {formatMessage(
          {
            id: 'Are you sure you want to remove {name} from this organization?'
          },
          {
            name: (
              <Typography component="span" fontWeight={700}>
                {pendingRemoveMember?.label ?? '?'}
              </Typography>
            )
          }
        )}
      </StandardDialog>
    </PageContainer>
  );
};

Organization.propTypes = {
  error: PropTypes.shape({}),
  isLoading: PropTypes.bool.isRequired,
  organization: GrottoFullPropTypes
};

export default Organization;
