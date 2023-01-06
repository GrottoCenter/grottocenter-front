import * as React from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
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
import EntranceSnapshot from './EntranceSnapshots';
import REDUCER_STATUS from '../../../../reducers/ReducerStatus';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import getAuthor from '../../../../util/getAuthor';

function renderComponent(type, data) {
  switch (type) {
    case 'rigging':
      return <RiggingSnapshot rigging={data} key={data.id} />;
    case 'entrances':
      return <EntranceSnapshot entrance={data} key={data.id} />;
    default:
      // Todo: changer le default pour dire que ce n'est pas un truc pris en charge ou ajouter un warning sur la page générale
      return <GenericSnapshot data={data} key={data.id} />;
  }
}

const SnapshotPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const { id, type } = useParams();
  const { data, error, status, latestHttpCode } = useSelector(
    state => state.snapshots
  );

  useEffect(() => {
    dispatch(fetchSnapshot(id, type));
  }, [id, type, dispatch]);

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
            data && Object.keys(data).length > 0 ? (
              Object.keys(data).map(index => {
                const snapshot = data[index];
                return (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        {snapshot.author.nickname
                          ? `${snapshot.author.nickname} `
                          : ''}
                        {/* TODO: Mettre reviewer et author / prendre le nickname */}
                        {snapshot.id
                          ? ` ${new Date(
                              snapshot.id
                            ).toLocaleDateString()}-${new Date(
                              snapshot.id
                            ).toLocaleTimeString()} `
                          : ''}
                        {snapshot.title ? ` - ${snapshot.title} ` : ''}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {renderComponent(type, data[index])}
                    </AccordionDetails>
                    <AccordionActions>
                      <Contribution
                        author={getAuthor(snapshot.author)}
                        creationDate={snapshot.date}
                        reviewer={getAuthor(snapshot.reviewer)}
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
