import React, { useState, useEffect, useRef } from 'react';

import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Card, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import { usePermissions, useSubscriptions, useScrollToHashOnLoad } from '../../../hooks';
import { subscribeToMassif } from '../../../actions/Subscriptions/SubscribeToMassif';
import { unsubscribeFromMassif } from '../../../actions/Subscriptions/UnsubscribeFromMassif';
import { deleteMassif } from '../../../actions/Massif/DeleteMassif';
import { restoreMassif } from '../../../actions/Massif/RestoreMassif';
import FixedLayout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
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
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [isDeleteConfirmationPermanent, setIsDeleteConfirmationPermanent] =
    useState(false);
  const [wantedDeletedState, setWantedDeletedState] = useState(false);

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
  const componentRef = useRef();

  let title = '';
  if (massif?.name) {
    title = massif?.name;
  } else if (!error) {
    title = formatMessage({ id: 'Loading massif data...' });
  }

  return (
    <div ref={componentRef}>
      <FixedLayout>
        {massif && (
          <FixedContent
            displayShare
            printRef={componentRef}
            icon={<CustomIcon type="massif" />}
            onEdit={!error ? onEdit : null}
            onDelete={!error ? onDelete : null}
            isSubscribed={!error ? isSubscribed : null}
            isSubscribeLoading={isSubscribeLoading}
            onChangeSubscribe={
              !error && permissions.isLeader && !massif?.isDeleted
                ? handleChangeSubscribe
                : undefined
            }
            title={isLoading ? <Skeleton /> : title}
            footer={
              (massif?.author ||
                massif?.reviewer ||
                massif?.language ||
                massif?.names?.[0]?.language) && (
                <Typography component="div" variant="caption">
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
              )
            }
            content={
              <>
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
                {massif?.geogPolygon && (
                  <MapMassif
                    massifId={massifIdInt}
                    geogPolygon={massif?.geogPolygon}
                  />
                )}
              </>
            }
          />
        )}
        {isLoading && (
          <Card sx={{ padding: 3 }}>
            <Skeleton height={300} width="100%" />
            <Skeleton height={100} />
            <Skeleton height={100} />
            <Skeleton height={100} />
          </Card>
        )}
        {error && (
          <Card sx={{ padding: 3 }}>
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
                content={<EntitiesList type="cave" entities={massif.networks} />}
              />
            )}
            <Documents
              documents={massif?.documents ?? []}
              massifId={massifId}
            />
          </>
        )}
      </FixedLayout>
    </div>
  );
};

Massif.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  massif: MassifTypes
};

export default Massif;
