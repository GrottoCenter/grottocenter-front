import React, { useEffect } from 'react';
import { propOr, isNil } from 'ramda';
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

  useEffect(() => {
    dispatch(fetchEntry(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
