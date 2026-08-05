import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import Skeleton from '@mui/material/Skeleton';

import { useParams, useSearchParams } from 'react-router-dom';
import { isEmpty } from 'ramda';
import { Divider } from '@mui/material';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import { fetchEntrance } from '../../../actions/Entrance/GetEntrance';
import MoveEntranceToCaveForm from './MoveEntranceToCaveForm';
import Alert from '../../common/Alert';
import AuthChecker from '../AuthChecker';

const MoveEntranceToCave = () => {
  const { formatMessage } = useIntl();
  const { id: entranceId } = useParams();
  const [searchParams] = useSearchParams();
  // The page title reflects the chosen action (deep-linked via ?mode=).
  const isDetach = searchParams.get('mode') === 'detach';
  const dispatch = useDispatch();
  const {
    loading: fetchLoading,
    data: entrance,
    error: fetchError
  } = useSelector(state => state.entrance);

  useEffect(() => {
    dispatch(fetchEntrance(entranceId));
  }, [dispatch, entranceId]);

  return (
    <Layout
      title={formatMessage({
        id: isDetach ? 'Detach the entrance' : 'Attach the entrance'
      })}
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
                    content={formatMessage(
                      { id: 'entrance.load.error' },
                      { entranceId }
                    )}
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
