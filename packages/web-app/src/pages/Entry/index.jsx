import React, { useEffect, useRef } from 'react';
import { propOr, isNil, isEmpty } from 'ramda';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Entry from '../../components/appli/Entry';
import { fetchEntry } from '../../actions/Entry';
import {
  getComments,
  getDetails,
  getDescriptions,
  getDocuments,
  getHistories,
  getLocations,
  getRiggings
} from './transformers';

const EntryPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data, error } = useSelector(state => state.entry);
  const { loading: updateLoading, error: updateError } = useSelector(
    state => state.entrancePut
  );
  const prevUpdateLoading = useRef(updateLoading);

  useEffect(() => {
    dispatch(fetchEntry(id));
  }, [id, dispatch]);

  useEffect(() => {
    const updateTerminatedWithSuccess =
      prevUpdateLoading.current === true &&
      updateLoading === false &&
      updateError === null;
    if (updateTerminatedWithSuccess || isEmpty(data)) {
      dispatch(fetchEntry(id));
    }
  }, [dispatch, updateLoading, id, data, updateError]);

  useEffect(() => {
    prevUpdateLoading.current = updateLoading;
  }, [updateLoading]);

  const comments = getComments(propOr([], 'comments', data));
  const descriptions = getDescriptions(propOr([], 'descriptions', data));
  const details = getDetails(data);
  const documents = getDocuments(propOr([], 'documents', data));
  const histories = getHistories(propOr([], 'histories', data));
  const locations = getLocations(propOr([], 'locations', data));
  const riggings = getRiggings(propOr([], 'riggings', data));

  return (
    <Entry
      loading={loading || !isNil(error)}
      details={details}
      comments={comments}
      descriptions={descriptions}
      documents={documents}
      histories={histories}
      locations={locations}
      riggings={riggings}
    />
  );
};
export default EntryPage;
