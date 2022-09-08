import React, { useEffect, useRef } from 'react';
import { propOr, isNil, isEmpty } from 'ramda';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Entry from '../../components/appli/Entry';
import { fetchEntrance } from '../../actions/Entrance/GetEntrance';
import {
  getComments,
  getDetails,
  getDescriptions,
  getDocuments,
  getHistories,
  getLocations,
  getRiggings
} from './transformers';

const isUpdateSuccessful = (data, error, loading, prevLoading) => {
  const updateTerminatedWithSuccess =
    prevLoading.current === true && loading === false && error === null;
  return updateTerminatedWithSuccess || isEmpty(data);
};

const EntryPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data, error } = useSelector(state => state.entrance);
  const {
    loading: updateEntranceLoading,
    error: updateEntranceError
  } = useSelector(state => state.updateEntrance);
  const prevupdateEntranceLoading = useRef(updateEntranceLoading);
  const {
    loading: associateDocumentLoading,
    error: associateDocumentError
  } = useSelector(state => state.associateDocumentToEntrance);
  const prevAssociateDocumentLoading = useRef(associateDocumentLoading);

  // Initial data loading
  useEffect(() => {
    dispatch(fetchEntrance(id));
  }, [id, dispatch]);

  // Fetching entrance after successful update
  useEffect(() => {
    if (
      isUpdateSuccessful(
        data,
        updateEntranceError,
        updateEntranceLoading,
        prevupdateEntranceLoading
      )
    ) {
      dispatch(fetchEntrance(id));
    }
  }, [dispatch, data, updateEntranceLoading, id, updateEntranceError]);
  useEffect(() => {
    if (
      isUpdateSuccessful(
        data,
        associateDocumentError,
        associateDocumentLoading,
        prevAssociateDocumentLoading
      )
    ) {
      dispatch(fetchEntrance(id));
    }
  }, [dispatch, data, id, associateDocumentError, associateDocumentLoading]);

  // Track loadings
  useEffect(() => {
    prevAssociateDocumentLoading.current = associateDocumentLoading;
  }, [associateDocumentLoading]);
  useEffect(() => {
    prevupdateEntranceLoading.current = updateEntranceLoading;
  }, [updateEntranceLoading]);

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
