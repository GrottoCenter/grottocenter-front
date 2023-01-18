import * as React from 'react';
import { useIntl } from 'react-intl';
import { useParams, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Typography
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import ExpandMore from '@material-ui/icons/ExpandMore';

import Alert from '../../../common/Alert';
import Contribution from '../../../common/Contribution/Contribution';
import { fetchSnapshot } from '../../../../actions/Snapshot/GetSnapshots';
import GenericSnapshot from './GenericSnapshots';
import RiggingSnapshot from './RiggingSnapshots';
import EntranceCaveSnapshot from './EntranceCaveSnapshots';
import EntranceNetworkSnapshots from './EntranceNetworkSnapshots';
import REDUCER_STATUS from '../../../../reducers/ReducerStatus';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import getAuthor from '../../../../util/getAuthor';

function renderComponent(type, data, isNetwork) {
  switch (type) {
    case 'rigging':
      return <RiggingSnapshot rigging={data} key={data.id} />;
    case 'entrances':
      return isNetwork ? (
        <EntranceNetworkSnapshots entrance={data} key={data.id} />
      ) : (
        <EntranceCaveSnapshot entrance={data} key={data.id} />
      );
    default:
      // Todo: changer le default pour dire que ce n'est pas un truc pris en charge ou ajouter un warning sur la page générale
      return <GenericSnapshot data={data} key={data.id} />;
  }
}

const SnapshotPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const location = useLocation();
  const queryParameters = new URLSearchParams(location.search);
  const isNetwork = queryParameters.get('isNetwork') === 'true';

  const { id, type } = useParams();
  const { data, error, status, latestHttpCode } = useSelector(
    state => state.snapshots
  );
  const dataSnapshots = data.entrances ?? data;

  useEffect(() => {
    dispatch(fetchSnapshot(id, type, isNetwork));
  }, [id, type, isNetwork, dispatch]);

  const isLoading = status === REDUCER_STATUS.LOADING;
  const isSuccess = status === REDUCER_STATUS.SUCCEEDED;
  const is404 = error && latestHttpCode === 404;
  const is403 = error && latestHttpCode === 403;
  return (
    <>
      {isLoading && <Skeleton height={150} />}
      {is404 && (
        <Alert
          title={formatMessage({
            id: `This ${type} has no related snapshot`
          })}
          severity="error"
        />
      )}
      {is403 && (
        <Alert
          title={formatMessage({
            id: `This ${type} is related to a sensitive entrance`
          })}
          severity="warning"
        />
      )}
      {isSuccess && (
        <ScrollableContent
          dense
          title={formatMessage({ id: `${type} snapshots` })}
          content={
            dataSnapshots && Object.keys(dataSnapshots).length > 0 ? (
              Object.keys(dataSnapshots).map(index => {
                const snapshot = dataSnapshots[index];
                const author = getAuthor(snapshot.author);
                const reviewer = getAuthor(snapshot.reviewer);
                return (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        {reviewer
                          ? `${reviewer.nickname} - `
                          : `${author.nickname} - `}
                        {snapshot.id
                          ? ` ${new Date(
                              snapshot.id
                            ).toLocaleDateString()}-${new Date(
                              snapshot.id
                            ).toLocaleTimeString()} `
                          : ' '}
                        {snapshot.title ?? snapshot.name ?? '' }
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {renderComponent(type, snapshot, isNetwork ?? false)}
                    </AccordionDetails>
                    <AccordionActions>
                      <Contribution
                        author={author}
                        creationDate={snapshot.date}
                        reviewer={reviewer}
                        dateReviewed={snapshot.dateReviewed}
                      />
                    </AccordionActions>
                  </Accordion>
                );
              })
            ) : (
              <Alert
                severity="info"
                content={formatMessage({
                  id: `There is currently no snapshot registered for this ${type}`
                })}
              />
            )
          }
        />
      )}
    </>
  );
};
export default SnapshotPage;
