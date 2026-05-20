import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import { Print } from '@mui/icons-material';
import CreateIcon from '@mui/icons-material/Create';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ShareIcon from '@mui/icons-material/Share';
import { useReactToPrint } from 'react-to-print';

import {
  usePermissions,
  useSubscriptions,
  useScrollToHashOnLoad,
  useSharePage
} from '../../../hooks';
import { subscribeToMassif } from '../../../actions/Subscriptions/SubscribeToMassif';
import { unsubscribeFromMassif } from '../../../actions/Subscriptions/UnsubscribeFromMassif';
import { deleteMassif } from '../../../actions/Massif/DeleteMassif';
import { restoreMassif } from '../../../actions/Massif/RestoreMassif';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import PageHeader from '../../common/Layouts/PageHeader';
import PageTabs from '../../common/Layouts/PageTabs';
import ResponsiveActions from '../../common/Layouts/ResponsiveActions';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import EntitiesList from '../../common/entitiesList/EntitiesList';
import Alert from '../../common/Alert';
import MapMassif from './MapMassif';
import Documents from './Documents';
import Descriptions from '../Descriptions';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import CustomIcon from '../../common/CustomIcon';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';
import { MassifTypes } from '../../../types/massif.type';

const Massif = ({ isLoading, error, massif }) => {
  const dispatch = useDispatch();
  const { massifId } = useParams();
  const massifIdInt = parseInt(massifId, 10);
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const componentRef = useRef();
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

  const { dataMassif } = useSelector(state => state.statisticsMassif);
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
    dispatch(deleteMassif({ id: massifId, entityId, isPermanent }));
    if (isPermanent) navigate('/', { replace: true });
  };
  const onRestorePress = () => {
    setWantedDeletedState(false);
    dispatch(restoreMassif({ id: massifId }));
  };

  const {
    isSubscribed: isSubscribedMethod,
    isMassifLoading: isSubscribeLoading
  } = useSubscriptions();
  const isSubscribed = massif ? isSubscribedMethod(massif.id) : false;

  const handleChangeSubscribe = () => {
    if (!isSubscribed) {
      dispatch(subscribeToMassif(massifId));
    } else {
      dispatch(unsubscribeFromMassif(massifId));
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
          hidden: !onDelete
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
      disabled: !!massif && !permissions.isAuth && (massif.documents?.length ?? 0) === 0
    }
  ];

  return (
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
            <Card sx={{ m: 2, p: 3 }}>
              <Skeleton height={300} width="100%" />
              <Skeleton height={100} />
              <Skeleton height={100} />
              <Skeleton height={100} />
            </Card>
          )}
          {error && (
            <Card sx={{ m: 2, p: 3 }}>
              <Alert
                title={formatMessage({
                  id: 'Error, the massif data you are looking for is not available.'
                })}
                severity="error"
              />
            </Card>
          )}
          {massif && (
            <>
              {massif.isDeleted && (
                <Box sx={{ m: 2 }}>
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
                </Box>
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
              {massif.isSensitive && (
                <Alert
                  severity="warning"
                  title={formatMessage({
                    id: 'This massif is marked as sensitive based on applicable legislation.'
                  })}
                />
              )}
              {(massif?.geogPolygon ||
                massif?.author ||
                massif?.reviewer ||
                massif?.language ||
                massif?.names?.[0]?.language) && (
                  <ScrollableContent
                    content={
                      <>
                        {massif?.geogPolygon && (
                          <MapMassif
                            massifId={massifIdInt}
                            geogPolygon={massif?.geogPolygon}
                          />
                        )}
                        {(massif?.author ||
                          massif?.reviewer ||
                          massif?.language ||
                          massif?.names?.[0]?.language) && (
                            <Typography
                              component="div"
                              variant="caption"
                              sx={{ mt: massif?.geogPolygon ? 2 : 0 }}>
                              {massif.author && (
                                <AuthorAndDate
                                  author={massif.author}
                                  verb="Created"
                                  date={massif.dateInscription}
                                />
                              )}
                              {massif.author && massif.reviewer && ' · '}
                              {massif.reviewer && (
                                <AuthorAndDate
                                  author={massif.reviewer}
                                  verb="Updated"
                                  date={massif.dateReviewed}
                                />
                              )}
                              {(massif.author || massif.reviewer) &&
                                (massif.language || massif.names?.[0]?.language) &&
                                ' · '}
                              {(massif.language || massif.names?.[0]?.language) &&
                                `${formatMessage({ id: 'Language' })} : ${(massif.language ?? massif.names[0].language).toUpperCase()}`}
                            </Typography>
                          )}
                      </>
                    }
                  />
                )}
              <Box sx={{ mx: 2, mb: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<CustomIcon type="entrance" />}
                  onClick={() => navigate(`/ui/massifs/${massifId}/entrances`)}>
                  {formatMessage({ id: 'Entrances list' })}
                  {dataMassif?.nb_caves ? ` (${dataMassif.nb_caves})` : ''}
                </Button>
              </Box>
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
            </>
          )}
        </div>

        {/* Tab Documents */}
        <div>
          {isLoading && (
            <Card sx={{ m: 2, p: 3 }}>
              <Skeleton height={40} width="100%" />
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </Card>
          )}
          {massif && (
            <Documents documents={massif.documents ?? []} massifId={massifId} />
          )}
        </div>
      </PageTabs>
    </div>
  );
};

Massif.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  massif: MassifTypes
};

export default Massif;
