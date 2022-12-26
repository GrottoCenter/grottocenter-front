import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil, propOr } from 'ramda';
import Massif from '../../components/appli/Massif/Massif';
import { loadMassif } from '../../actions/Massif/GetMassif';
import { usePermissions, useUserProperties } from '../../hooks';
import {
  getDetails,
  getDescriptions,
  getDocuments,
  getEntrances,
  getNetworks
} from './transformers';
import { subscribeToMassif } from '../../actions/Subscriptions/SubscribeToMassif';
import { fetchSubscriptions } from '../../actions/Subscriptions/GetSubscriptions';
import { unsubscribeFromMassif } from '../../actions/Subscriptions/UnsubscribeFromMassif';
import Deleted, {
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const MassifPage = () => {
  const dispatch = useDispatch();
  const { massifId: massifIdString } = useParams();
  const massifId = Number(massifIdString);
  const history = useHistory();
  const permissions = usePermissions();
  const userProperties = useUserProperties();

  const { massif, isFetching, error } = useSelector(state => state.massif);
  const canEdit = permissions.isAuth;
  const canSubscribe = permissions.isLeader;

  // Initial data fetch
  useEffect(() => {
    dispatch(loadMassif(massifId));
    if (userProperties) {
      dispatch(fetchSubscriptions(userProperties.id));
    }
  }, [massifId, userProperties, dispatch]);

  const onEdit = () => {
    history.push(`/ui/massifs/${massifId}/edit`);
  };

  const onSubscribe = () => dispatch(subscribeToMassif(massifId));
  const onUnsubscribe = () => dispatch(unsubscribeFromMassif(massifId));
  const descriptions = getDescriptions(propOr([], 'descriptions', massif));
  const details = getDetails(massif);
  const documents = getDocuments(propOr([], 'documents', massif));
  const entrances = getEntrances(propOr([], 'entrances', massif));
  const networks = getNetworks(propOr([], 'networks', massif));

  return details.isDeleted ? (
    <Deleted
      redirectTo={massif.redirectTo}
      entity={DELETED_ENTITIES.massif}
      name={details.name}
      creationDate={details.dateInscription}
      dateReviewed={details.dateReviewed}
      author={details.author}
      reviewer={details.reviewer}
    />
  ) : (
    <Massif
      isFetching={isFetching || !isNil(error)}
      error={error}
      descriptions={descriptions}
      details={details}
      documents={documents}
      entrances={entrances}
      networks={networks}
      onEdit={onEdit}
      canEdit={canEdit}
      onSubscribe={onSubscribe}
      onUnsubscribe={onUnsubscribe}
      canSubscribe={canSubscribe}
    />
  );
};
export default MassifPage;
