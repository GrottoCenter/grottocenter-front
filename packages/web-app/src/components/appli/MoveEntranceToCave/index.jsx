import { useIntl } from 'react-intl';
import Skeleton from '@mui/material/Skeleton';

import { useParams, useSearchParams } from 'react-router-dom';
import { isEmpty } from 'ramda';
import { Divider } from '@mui/material';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import { useEntrance } from '../../../hooks';
import MoveEntranceToCaveForm from './MoveEntranceToCaveForm';
import Alert from '../../common/Alert';
import AuthChecker from '../AuthChecker';

const MoveEntranceToCave = () => {
  const { formatMessage } = useIntl();
  const { id: entranceId } = useParams();
  const [searchParams] = useSearchParams();
  // The page title reflects the chosen action (deep-linked via ?mode=).
  const isDetach = searchParams.get('mode') === 'detach';
  const {
    isPending: fetchLoading,
    data: entrance,
    error: fetchError
  } = useEntrance(entranceId);

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
