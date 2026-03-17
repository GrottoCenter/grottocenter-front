import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { HistoryPropTypes } from '../../../../types/entrance.type';
import History from './History';
import CreateHistoryForm from '../../EntitiesForm/History';
import { postHistory } from '../../../../actions/History/CreateHistory';
import { moveHistoryRelevance } from '../../../../actions/History/MoveRelevance';
import { usePermissions } from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import { sortByRelevance } from '../../../../helpers/sortByRelevance';
import Alert from '../../../common/Alert';

const Histories = ({ entranceId, histories, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { movingId, handleMove } = useMoveRelevanceWithUndo(moveHistoryRelevance);

  const onSubmitForm = data => {
    dispatch(
      postHistory({
        entrance: entranceId,
        body: data.body,
        language: data.language
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      anchorId="history"
      title={formatMessage({ id: 'History' })}
      icon={
        permissions.isAuth &&
        isEditAllowed && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new history' })
                : formatMessage({ id: 'Add a new history' })
            }
          >
            <Button
              color={isFormVisible ? 'inherit' : 'secondary'}
              variant="outlined"
              onClick={() => setIsFormVisible(!isFormVisible)}
              startIcon={isFormVisible ? <CancelIcon /> : <AddCircleIcon />}
            >
              {formatMessage({ id: isFormVisible ? 'Cancel' : 'New' })}
            </Button>
          </Tooltip>
        )
      }
      content={
        <>
          {isFormVisible && (
            <>
              <CreateHistoryForm isNewHistory onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {histories.length > 0 ? (
            <List dense disablePadding>
              {(() => {
                const sorted = sortByRelevance(histories);
                const activeIds = sorted
                  .filter(h => !h.isDeleted)
                  .map(h => h.id);
                return sorted.map(history => (
                  <React.Fragment key={history.id}>
                    <History
                      history={history}
                      isEditAllowed={isEditAllowed}
                      isMoving={movingId === history.id}
                      onMoveUp={() => handleMove(history.id, -1)}
                      onMoveDown={() => handleMove(history.id, 1)}
                      isFirst={history.id === activeIds[0]}
                      isLast={history.id === activeIds[activeIds.length - 1]}
                    />
                  </React.Fragment>
                ));
              })()}
            </List>
          ) : (
            <Alert
              severity="info"
              content={formatMessage({
                id: 'There is currently no history for this entrance.'
              })}
            />
          )}
        </>
      }
    />
  );
};

Histories.propTypes = {
  entranceId: PropTypes.number.isRequired,
  histories: PropTypes.arrayOf(HistoryPropTypes),
  isEditAllowed: PropTypes.bool
};

export default Histories;
