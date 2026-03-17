import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Box, Card } from '@mui/material';
import { useIntl } from 'react-intl';

import { usePermissions, useSubscriptions } from '../../../hooks';
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

  let title = '';
  if (massif?.name) {
    title = massif?.name;
  } else if (!error) {
    title = formatMessage({ id: 'Loading massif data...' });
  }

  return (
    <FixedLayout>
      {massif && (
        <FixedContent
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
          subheader={
            massif?.names &&
            `${formatMessage({ id: 'Language' })} : ${massif?.names[0].language}`
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
          <Box style={{ display: 'flex', justifyContent: 'center' }}>
            <Skeleton height={300} width={800} />
          </Box>
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
          <ScrollableContent
            anchorId="statistics"
            title={formatMessage({ id: 'More information' })}
            content={
              <StatisticsDataDashboard
                massifId={massifIdInt}
                hideTitle
              />
            }
          />
          <Documents
            documents={massif?.documents ?? []}
            massifId={massifId}
          />
          {massif?.networks?.length > 0 && (
            <ScrollableContent
              anchorId="networks"
              title={formatMessage({ id: 'Networks list' })}
              content={
                <EntitiesList
                  type="cave"
                  entites={massif.networks}
                />
              }
            />
          )}
        </>
      )}
    </FixedLayout>
  );
};

Massif.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  massif: MassifTypes
};

export default Massif;
