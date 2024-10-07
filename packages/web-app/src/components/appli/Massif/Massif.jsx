import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';
import { useParams, useNavigate } from 'react-router-dom';

import { useDispatch } from 'react-redux';
import Skeleton from '@mui/material/Skeleton';
import { Box } from '@mui/material';
import { useIntl } from 'react-intl';

import { usePermissions, useSubscriptions } from '../../../hooks';
import { subscribeToMassif } from '../../../actions/Subscriptions/SubscribeToMassif';
import { unsubscribeFromMassif } from '../../../actions/Subscriptions/UnsubscribeFromMassif';
import { deleteMassif } from '../../../actions/Massif/DeleteMassif';
import { restoreMassif } from '../../../actions/Massif/RestoreMassif';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CavesList from '../../common/cave/CavesList';
import Alert from '../../common/Alert';
import MapMassif from './MapMassif';
import Documents from './Documents';
import Descriptions from './Descriptions';
import StatisticsDataDashboard from '../StatisticsDataDashboard';
import {
  DeletedCard,
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '../../common/card/Deleted';

import { MassifTypes } from '../../../types/massif.type';

const Massif = ({ isLoading, error, massif }) => {
  const dispatch = useDispatch();
  const { massifId } = useParams();
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
    <FixedContent
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
        isLoading ? (
          <Skeleton />
        ) : (
          massif?.names &&
          `${formatMessage({ id: 'Language' })} : ${massif?.names[0].language}`
        )
      }
      content={
        <>
          {isLoading && (
            <>
              <Box style={{ display: 'flex', justifyContent: 'center' }}>
                <Skeleton height={300} width={800} /> {/* Map Skeleton */}
              </Box>
              <Skeleton height={100} /> {/* Documents Skeleton */}
              <Skeleton height={100} /> {/* EntranceList Skeleton */}
              <Skeleton height={100} /> {/* CavesList Skeleton */}
            </>
          )}
          {error && (
            <Alert
              title={formatMessage({
                id: 'Error, the massif data you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {massif && (
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

              <Box
                alignItems="start"
                display="flex"
                flexBasis="300px"
                justifyContent="space-between">
                {massif?.descriptions?.length > 0 ? (
                  <Descriptions descriptions={massif.descriptions} />
                ) : (
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif has no descriptions listed yet.'
                    })}
                  />
                )}
              </Box>
              {massif?.geogPolygon && massif?.entrances && (
                <>
                  <hr />
                  <MapMassif
                    entrances={massif?.entrances}
                    geogPolygon={massif?.geogPolygon}
                  />
                </>
              )}
              <hr />
              <StatisticsDataDashboard massifId={parseInt(massifId, 10)} />
              <hr />
              <Documents
                documents={massif?.documents ?? []}
                massifId={massifId}
              />
              <hr />
              <CavesList
                caves={massif?.networks ?? []}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif has no networks listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Networks list' })}
              />
            </>
          )}
        </>
      }
    />
  );
};

Massif.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  massif: MassifTypes
};

export default Massif;
