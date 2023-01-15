import React, { useEffect, useRef } from 'react';
import { isNil } from 'ramda';
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
import Deleted, {
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const isUpdateSuccessful = (error, loading, prevLoading) => {
  const updateTerminatedWithSuccess =
    prevLoading.current === true && loading === false && error === null;
  return updateTerminatedWithSuccess;
};

const EntryPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { loading, data, error } = useSelector(state => state.entrance);
  const { loading: updateEntranceLoading, error: updateEntranceError } =
    useSelector(state => state.updateEntrance);
  const prevupdateEntranceLoading = useRef(updateEntranceLoading);
  const { loading: associateDocumentLoading, error: associateDocumentError } =
    useSelector(state => state.associateDocumentToEntrance);
  const prevAssociateDocumentLoading = useRef(associateDocumentLoading);

  // Initial data loading
  useEffect(() => {
    dispatch(fetchEntrance(id));
  }, [id, dispatch]);

  // Fetching entrance after successful update
  useEffect(() => {
    if (
      isUpdateSuccessful(
        updateEntranceError,
        updateEntranceLoading,
        prevupdateEntranceLoading
      )
    ) {
      dispatch(fetchEntrance(id));
    }
  }, [dispatch, updateEntranceLoading, id, updateEntranceError]);

  useEffect(() => {
    if (
      isUpdateSuccessful(
        associateDocumentError,
        associateDocumentLoading,
        prevAssociateDocumentLoading
      )
    ) {
      dispatch(fetchEntrance(id));
    }
  }, [dispatch, id, associateDocumentError, associateDocumentLoading]);

  // Track loadings
  useEffect(() => {
    prevAssociateDocumentLoading.current = associateDocumentLoading;
  }, [associateDocumentLoading]);
  useEffect(() => {
    prevupdateEntranceLoading.current = updateEntranceLoading;
  }, [updateEntranceLoading]);

  const comments = getComments(data.comments ?? []);
  const descriptions = getDescriptions(data.descriptions ?? []);
  const details = getDetails(data);
  const documents = getDocuments(data.documents ?? []);
  const histories = getHistories(data.histories ?? []);
  const locations = getLocations(data.locations ?? []);
  const riggings = getRiggings(data.riggings ?? []);
  return data.isDeleted ? (
    <Deleted
      redirectTo={data.redirectTo}
      entity={DELETED_ENTITIES.entrance}
      location={details.localisation}
      name={data.name}
      creationDate={data.dateInscription}
      dateReviewed={data.dateReviewed}
      author={details.author}
      reviewer={details.reviewer}
    />
  ) : (
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
