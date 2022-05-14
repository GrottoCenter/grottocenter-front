import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil } from 'ramda';
import Massif from '../components/appli/Massif/Massif';
import { loadMassif } from '../actions/Massif';
import { usePermissions } from '../hooks';

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
    history.push(`/ui/massifs/edit/${massifId}`);
  };

  return (
    <Massif
      isFetching={isFetching || !isNil(error)}
      error={error}
      massif={massif}
      onEdit={onEdit}
      canEdit={canEdit}
    />
  );
};
export default MassifPage;
