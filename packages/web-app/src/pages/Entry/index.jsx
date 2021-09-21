import React, { useEffect } from 'react';
import { pathOr, isNil } from 'ramda';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Entry from '../../components/appli/Entry';
import { fetchEntry } from '../../actions/Entry';
import {
  getComments,
  getDetails,
  getDescriptions,
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

  const details = getDetails(data);
  const comments = getComments(pathOr([], ['comments'], data));
  const descriptions = getDescriptions(pathOr([], ['descriptions'], data));
  const riggings = getRiggings(pathOr([], ['riggins'], data));

  return (
    <Entry
      loading={loading || !isNil(error)}
      details={details}
      comments={comments}
      descriptions={descriptions}
      riggings={riggings}
      entryId={id}
    />
  );
};
export default EntryPage;
