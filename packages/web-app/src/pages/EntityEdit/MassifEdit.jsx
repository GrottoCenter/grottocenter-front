import React, { useEffect } from 'react';
import { useParams /* , useHistory */ } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadMassif } from '../../actions/Massif';
import MassifEditContainer from './MassifEditContainer';

const MassifEdit = () => {
  const { massifId } = useParams();
  const dispatch = useDispatch();

  const { massif, isFetching } = useSelector(state => state.massif);

  useEffect(() => {
    dispatch(loadMassif(massifId));
  }, [massifId, dispatch]);

  return <MassifEditContainer isFetching={isFetching} massif={massif} />;
};

export default MassifEdit;
