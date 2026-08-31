import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import { Button, Card, CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';
import { Print } from '@mui/icons-material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ShareIcon from '@mui/icons-material/Share';
import { useReactToPrint } from 'react-to-print';

import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import {
  useDeleteMassif,
  useRestoreMassif,
  usePermissions,
  useScrollToHashOnLoad,
  useSharePage,
  useStatisticsMassif,
  useSubscribeToMassif,
  useSubscriptions,
  useUnsubscribeFromMassif
} from '../../../hooks';
import PageContainer from '../../common/Layouts/PageContainer';
import PageHeader from '../../common/Layouts/PageHeader';
import PageTabs from '../../common/Layouts/PageTabs';
import SectionStack from '../../common/Layouts/SectionStack';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import Alert from '../../common/Alert';
import FetchErrorState from '../../common/FetchErrorState';
import MapMassif from './MapMassif';
import Documents from './Documents';
import Guidelines from '../Guidelines';
import Descriptions from '../Descriptions';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomIcon from '../../common/CustomIcon';
import ContributionMetadata from '../../common/Contribution/ContributionMetadata';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';
import { MassifTypes } from '../../../types/massif.type';
import AssociationSection from '../OrganizationAssociation';

const Massif = ({
  isLoading,
  error,
  isPaused = false,
  onRetry = null,
  massif
}) => {
  const { massifId } = useParams();
  const massifIdInt = parseInt(massifId, 10);
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const componentRef = useRef();
  const deleteMutation = useDeleteMassif();
  const restoreMutation = useRestoreMassif();
  const subscribeMutation = useSubscribeToMassif();
  const unsubscribeMutation = useUnsubscribeFromMassif();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);
  const handleShare = useSharePage();
  const handlePrint = useReactToPrint({ contentRef: componentRef });

  useEffect(() => {
    if (massif) setWantedDeletedState(massif.isDeleted);
  }, [massif]);

  const { data: dataMassif } = useStatisticsMassif(massifIdInt);
  useScrollToHashOnLoad(dataMassif);

  let onEdit = null;
  let onDelete = null;
  if (permissions.isAuth && !massif?.isDeleted) {
    onEdit = () => {
      navigate(`/ui/massifs/${massifId}/edit`);
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
    deleteMutation.mutate({ id: massifId, entityId, isPermanent });
    if (isPermanent) navigate('/', { replace: true });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    restoreMutation.mutate({ id: massifId });
  };

  const {
    isSubscribed: isSubscribedMethod,
    isMassifLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = massif ? isSubscribedMethod(massif.id) : false;

  const handleChangeSubscribe = () => {
    if (!isSubscribed) {
      subscribeMutation.mutate({ massifId });
    } else {
      unsubscribeMutation.mutate({ massifId });
    }
  };

  const isActionLoading = wantedDeletedState !== massif?.isDeleted;
  const canSubscribe =
    permissions.isLeader && massif && !massif.isDeleted && !error;

  let SubscribeIcon = <CircularProgress size={20} />;
  if (!isSubscribeLoading) {
    SubscribeIcon = isSubscribed ? (
      <NotificationsActiveIcon />
    ) : (
      <NotificationsNoneIcon />
    );
  }

  const actions = massif ? (
    <ResponsiveActions
      items={[
        {
          key: 'subscribe',
          icon: SubscribeIcon,
          label: formatMessage({
            id: isSubscribed ? 'Unsubscribe' : 'Subscribe'
          }),
          onClick: handleChangeSubscribe,
          color: isSubscribed ? 'secondary' : 'primary',
          hidden: !canSubscribe
        },
        {
          key: 'print',
          icon: <Print />,
          label: formatMessage({ id: 'Print' }),
          onClick: handlePrint
        },
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

  const tabs = [
    {
      id: 'information',
      label: formatMessage({ id: 'Information' }),
      icon: <ExploreOutlinedIcon fontSize="small" />
    },
    {
      id: 'documents',
      label: formatMessage({ id: 'Documents' }),
      icon: <PermMediaOutlinedIcon fontSize="small" />,
      count: massif?.documents?.length,
      disabled:
        !!massif && !permissions.isAuth && (massif.documents?.length ?? 0) === 0
    }
  ];

  return (
    <PageContainer>
      <div ref={componentRef}>
        <PageHeader
          title={massif?.name ?? (isLoading ? undefined : '')}
          icon={<CustomIcon type="massif" />}
          actions={actions}
        />
        <PageTabs tabs={tabs}>
          {/* Tab Information */}
          <div>
            {isLoading && (
              <SectionStack>
                <Card sx={{ p: 2 }}>
                  <Skeleton height={300} width="100%" />
                  <Skeleton height={100} />
                  <Skeleton height={100} />
                  <Skeleton height={100} />
                </Card>
              </SectionStack>
            )}
            {(error || isPaused) && (
              <SectionStack>
                <Card sx={{ p: 2 }}>
                  <FetchErrorState
                    error={error}
                    isPaused={isPaused}
                    onRetry={onRetry}
                    messageId="Error, the massif data you are looking for is not available."
                  />
                </Card>
              </SectionStack>
            )}
            {massif && (
              <SectionStack>
                {massif.isDeleted && (
                  <DeletedCard
                    entityType={DELETED_ENTITIES.massif}
                    entity={massif}
                    isLoading={isActionLoading}
                    onRestorePress={onRestorePress}
                    onPermanentDeletePress={() => {
                      setIsDeleteConfirmationPermanent(true);
                      setIsDeleteConfirmationOpen(true);
                    }}
                  />
                )}
                <DeleteConfirmationDialog
                  entityType={DELETED_ENTITIES.massif}
                  isOpen={isDeleteConfirmationOpen}
                  isLoading={isActionLoading}
                  isPermanent={isDeleteConfirmationPermanent}
                  onClose={() => setIsDeleteConfirmationOpen(false)}
                  onConfirmation={entity => {
                    onDeletePress(entity?.id, isDeleteConfirmationPermanent);
                  }}
                />
                {(massif?.geogPolygon ||
                  massif?.author ||
                  massif?.reviewer ||
                  massif?.language ||
                  massif?.names?.[0]?.language) && (
                  <ScrollableContent
                    content={
                      <>
                        {massif.isSensitive && (
                          <Alert
                            icon={
                              <LockOutlinedIcon
                                sx={{ color: 'secondary.main' }}
                              />
                            }
                            severity="warning"
                            content={formatMessage({
                              id: 'This massif is marked as sensitive based on applicable legislation.'
                            })}
                          />
                        )}
                        {massif?.geogPolygon && (
                          <MapMassif
                            massifId={massifIdInt}
                            geogPolygon={massif?.geogPolygon}
                          />
                        )}
                        <ContributionMetadata
                          createdBy={massif?.author}
                          createdAt={massif?.dateInscription}
                          updatedBy={massif?.reviewer}
                          updatedAt={massif?.dateReviewed}
                          language={
                            massif?.language ?? massif?.names?.[0]?.language
                          }
                        />
                      </>
                    }
                  />
                )}
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<CustomIcon type="entrance" size={24} />}
                  onClick={() => navigate(`/ui/massifs/${massifId}/entrances`)}>
                  {formatMessage({ id: 'Entrances list' })}
                  {dataMassif?.nb_caves ? ` (${dataMassif.nb_caves})` : ''}
                </Button>
                <Descriptions
                  descriptions={massif.descriptions ?? []}
                  entityType="massif"
                  entityId={massif.id}
                  isEditAllowed={!massif.isDeleted}
                  isAddAllowed={!massif.descriptions?.length}
                />
                <StatisticsDataDashboard
                  massifId={massifIdInt}
                  description={formatMessage({
                    id: 'Discover the numbers about this massif and its caves.'
                  })}
                />
                {(massif.guidelines?.length > 0 || permissions.isAuth) && (
                  <Guidelines
                    entityType="massifs"
                    entityId={massif.id}
                    entityName={massif.name}
                    guidelines={massif.guidelines}
                  />
                )}
                <AssociationSection
                  organizations={massif?.organizations}
                  entityType="massif"
                  entityId={massif.id}
                  isLoading={isLoading}
                />
                {massif?.networks?.length > 0 && (
                  <ScrollableContent
                    dense
                    anchorId="networks"
                    title={formatMessage({ id: 'Networks list' })}
                    count={massif.networks.length}
                    content={
                      <EntitiesList type="cave" entities={massif.networks} />
                    }
                  />
                )}
              </SectionStack>
            )}
          </div>

          {/* Tab Documents */}
          <div>
            {isLoading && (
              <SectionStack>
                <Card sx={{ p: 2 }}>
                  <Skeleton height={40} width="100%" />
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                  <Skeleton height={60} />
                </Card>
              </SectionStack>
            )}
            {massif && (
              <SectionStack>
                <Documents
                  documents={massif.documents ?? []}
                  massifId={massifId}
                />
              </SectionStack>
            )}
          </div>
        </PageTabs>
      </div>
    </PageContainer>
  );
};

Massif.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  isPaused: PropTypes.bool,
  onRetry: PropTypes.func,
  massif: MassifTypes
};

export default Massif;
