import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Typography, Skeleton } from '@mui/material';

import { pathOr } from 'ramda';

import Contribution from '../../../common/Contribution/Contribution';
import { fetchSnapshot } from '../../../../actions/Snapshot/GetSnapshots';
import REDUCER_STATUS from '../../../../reducers/ReducerStatus';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import SensitiveCaveWarning from '../SensitiveCaveWarning';
import AccordionSnapshotList from './AccordionSnapshotList';
import Alert403 from './error/403Alert';
import Alert404 from './error/404Alert';
import { getAccordionBodyFromType, sortSnapshots } from './UtilityFunction';
import AccordionSnapshotListPage from './AccordionSnapshotListPage';
import Translate from '../../../common/Translate';
import { fetchEntrance } from '../../../../actions/Entrance/GetEntrance';

const SnapshotPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);
  const isNetwork = queryParameters.get('isNetwork') === 'true';
  const getAll = queryParameters.get('all') === 'true';
  const [actualTItem, setActualTItem] = useState({});

  useEffect(() => {
    /*
    LocalStorage is used to pass data from one tab to another
    SessionStorage is used to keep data inside a tab (When refreshing a page for instance)
    */
    const jsonSessionStorage = sessionStorage.getItem('t_item');
    const json = jsonSessionStorage ?? localStorage.getItem('t_item');
    const items = json !== 'undefined' ? JSON.parse(json) : undefined;
    if (items) {
      setActualTItem(items);
    }
    if (!jsonSessionStorage) {
      sessionStorage.setItem('t_item', json);
    }
    return localStorage.removeItem('t_item');
  }, []);

  const { id, type } = useParams();

  const { data, status, latestHttpCode } = useSelector(
    state => state.snapshots
  );

  const { data: currentEntrance } = useSelector(state => state.entrance);

  useEffect(() => {
    dispatch(fetchSnapshot(id, type, isNetwork, getAll));
  }, [id, type, isNetwork, getAll, dispatch]);

  useEffect(() => {
    if (type === 'entrances') {
      dispatch(fetchEntrance(id));
    }
  }, [id, type, dispatch]);

  let currentTItem = {};
  switch (type) {
    case 'entrances':
      currentTItem = currentEntrance;
      break;
    default:
      currentTItem = actualTItem;
  }
  const isLoading = status === REDUCER_STATUS.LOADING;
  const isSuccess = status === REDUCER_STATUS.SUCCEEDED;
  const is404 = !isSuccess && latestHttpCode === 404;
  const is403 = !isSuccess && latestHttpCode === 403;
  const isSensitive =
    pathOr(false, ['entrances', '0', 'isSensitive'], data) ||
    currentTItem?.isSensitive;
  return (
    <>
      {isSensitive && <SensitiveCaveWarning />}
      {Object.keys(currentTItem).length > 0 && (
        <ScrollableContent
          dense
          title={
            <Translate
              id="{type}: Revision history"
              values={{
                type
              }}
              defaultMessage={`${type}: Revision history`}
            />
          }
          content={
            <>
              <Typography variant="h3">
                <Translate>Current</Translate>
              </Typography>
              {type !== 'riggings' && (
                <Typography variant="h4">
                  {currentTItem.title ?? currentTItem.name}
                </Typography>
              )}
              {getAccordionBodyFromType(type, currentTItem, isNetwork ?? false)}
              <Contribution
                reviewer={currentTItem.reviewer}
                dateReviewed={currentTItem.reviewedDate}
                withHours
              />
            </>
          }
        />
      )}
      {is403 && <Alert403 type={type} />}
      {is404 && <Alert404 type={type} />}
      {isLoading && <Skeleton height={300} />}
      {isSuccess &&
        (getAll ? (
          <AccordionSnapshotListPage
            data={sortSnapshots(data)}
            type={type}
            isNetwork={isNetwork}
          />
        ) : (
          <AccordionSnapshotList
            data={data}
            type={type}
            isNetwork={isNetwork}
            actualItem={currentTItem}
          />
        ))}
    </>
  );
};
export default SnapshotPage;
