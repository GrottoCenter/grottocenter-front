import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import Skeleton from '@material-ui/lab/Skeleton';

import { useParams } from 'react-router-dom';
import { isEmpty } from 'ramda';
import { Divider } from '@material-ui/core';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import { fetchEntrance } from '../../../actions/Entrance/GetEntrance';
import MoveEntranceToCaveForm from './MoveEntranceToCaveForm';
import Alert from '../../common/Alert';
import AuthChecker from '../AuthChecker';

const MoveEntranceToCave = () => {
  const { formatMessage } = useIntl();
  const { id: entranceId } = useParams();
  const dispatch = useDispatch();
  const {
    loading: fetchLoading,
    data: entrance,
    error: fetchError
  } = useSelector(state => state.entry);

  useEffect(() => {
    dispatch(fetchEntrance(entranceId));
  }, [dispatch, entranceId]);

  return (
    <Layout
      title={formatMessage({ id: 'Moving entrance to a new cave or network' })}
      content={
        <AuthChecker
          componentToDisplay={
            fetchLoading || fetchError ? (
              <>
                {fetchLoading && (
                  <>
                    <Skeleton height={100} />
                    <Divider />
                    <Skeleton height={200} />
                  </>
                )}
                {fetchError && (
                  <Alert
                    severity="error"
                    content={formatMessage({
                      id: `An error occured when loading the entrance of id ${entranceId}.`
                    })}
                  />
                )}
              </>
            ) : (
              !isEmpty(entrance) && (
                <MoveEntranceToCaveForm entrance={entrance} />
              )
            )
          }
        />
      }
    />
  );
};

MoveEntranceToCave.propTypes = {};

export default MoveEntranceToCave;
