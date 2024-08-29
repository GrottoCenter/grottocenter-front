import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isNil } from 'ramda';
import Network from '../../components/appli/Network';
import EntrancesList from '../../components/appli/Network/EntrancesList';
import { fetchCave } from '../../actions/Cave/GetCave';
import { getSafeData } from './transformer';
import { getDescriptions } from '../Entry/transformers';
import Descriptions from '../../components/appli/Descriptions';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

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
    if (updateTerminatedWithSuccess) {
      dispatch(fetchCave(id));
    }
  }, [dispatch, updateLoading, id, data, updateError]);

  useEffect(() => {
    prevUpdateLoading.current = updateLoading;
  }, [updateLoading]);

  const descriptions = getDescriptions(data.descriptions ?? []);
  const safeData = getSafeData(data);
  return data.isDeleted ? (
    <Deleted entityType={DELETED_ENTITIES.network} entity={data} />
  ) : (
    <Network loading={loading || !isNil(error)} data={safeData}>
      <>
        <EntrancesList />
        <Descriptions
          descriptions={descriptions}
          entityType="cave"
          entityId={id}
        />
      </>
    </Network>
  );
};

export default NetworkPage;
