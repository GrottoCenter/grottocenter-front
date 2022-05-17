import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil } from 'ramda';
import Network from '../../components/appli/Network';
import EntrancesList from '../../components/appli/Network/EntrancesList';
import { fetchCave } from '../../actions/Cave';
import { getSafeData } from './transformer';
import Descriptions from '../../components/appli/Network/Descriptions';

const NetworkPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data, error } = useSelector(state => state.cave);

  useEffect(() => {
    dispatch(fetchCave(id));
  }, [id, dispatch]);

  return (
    <Network loading={loading || !isNil(error)} data={getSafeData(data)}>
      <>
        <EntrancesList />
        <Descriptions />
      </>
    </Network>
  );
};

export default NetworkPage;
