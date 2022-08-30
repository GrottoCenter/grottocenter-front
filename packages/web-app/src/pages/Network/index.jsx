import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil, isEmpty } from 'ramda';
import Network from '../../components/appli/Network';
import EntrancesList from '../../components/appli/Network/EntrancesList';
import { fetchCave } from '../../actions/Cave/GetCave';
import { getSafeData } from './transformer';
import Descriptions from '../../components/appli/Network/Descriptions';

const NetworkPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data, error } = useSelector(state => state.cave);
  const { loading: updateLoading, error: updateError } = useSelector(
    state => state.updateCave
  );
  const prevUpdateLoading = useRef(updateLoading);

  useEffect(() => {
    dispatch(fetchCave(id));
  }, [id, dispatch]);

  useEffect(() => {
    const updateTerminatedWithSuccess =
      prevUpdateLoading.current === true &&
      updateLoading === false &&
      updateError === null;
    if (updateTerminatedWithSuccess || isEmpty(data)) {
      dispatch(fetchCave(id));
    }
  }, [dispatch, updateLoading, id, data, updateError]);

  useEffect(() => {
    prevUpdateLoading.current = updateLoading;
  }, [updateLoading]);

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
