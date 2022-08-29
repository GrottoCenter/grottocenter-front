import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil, propOr } from 'ramda';
import Massif from '../../components/appli/Massif/Massif';
import { loadMassif } from '../../actions/Massif/GetMassif';
import { usePermissions } from '../../hooks';
import {
  getDetails,
  getDescriptions,
  getDocuments,
  getEntrances,
  getNetworks
} from './transformers';

const MassifPage = () => {
  const { massifId } = useParams();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { massif, isFetching, error } = useSelector(state => state.massif);

  const canEdit = permissions.isAuth;

  const history = useHistory();

  useEffect(() => {
    dispatch(loadMassif(massifId));
  }, [massifId, dispatch]);

  const onEdit = () => {
    history.push(`/ui/massifs/${massifId}/edit`);
  };

  const descriptions = getDescriptions(propOr([], 'descriptions', massif));
  const details = getDetails(massif);
  const documents = getDocuments(propOr([], 'documents', massif));
  const entrances = getEntrances(propOr([], 'entrances', massif));
  const networks = getNetworks(propOr([], 'networks', massif));

  return (
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
    />
  );
};
export default MassifPage;
