import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Divider, List } from '@mui/material';

import SectionCreateButton from '@/components/common/SectionCreateButton';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { HistoryPropTypes } from '../../../../types/entrance.type';
import History from './History';
import CreateHistoryForm from '../../EntitiesForm/History';
import {
  useCreateHistory,
  useMoveHistoryRelevance,
  usePermissions
} from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import { sortByRelevance } from '../../../../helpers/sortByRelevance';
import Alert from '../../../common/Alert';

const Histories = ({ entranceId, histories, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const createMutation = useCreateHistory();
  const moveMutation = useMoveHistoryRelevance();
  const { movingId, handleMove } = useMoveRelevanceWithUndo(moveMutation);

  const onSubmitForm = data => {
    createMutation.mutate({
      entrance: entranceId,
      title: data.title ?? undefined,
      body: data.body,
      language: data.language
    });
    setIsFormVisible(false);
  };

  const sortedHistoryItems = useMemo(() => {
    const sorted = sortByRelevance(histories);
    const activeIds = sorted.filter(h => !h.isDeleted).map(h => h.id);
    return sorted.map(history => (
      <React.Fragment key={history.id}>
        <History
          history={history}
          entranceId={entranceId}
          isEditAllowed={isEditAllowed}
          isMoving={movingId === history.id}
          onMoveUp={() => handleMove(history.id, -1)}
          onMoveDown={() => handleMove(history.id, 1)}
          isFirst={history.id === activeIds[0]}
          isLast={history.id === activeIds[activeIds.length - 1]}
        />
      </React.Fragment>
    ));
  }, [histories, entranceId, isEditAllowed, movingId, handleMove]);

  return (
    <ScrollableContent
      dense
      anchorId="history"
      defaultExpanded={histories.length > 0}
      title={formatMessage({ id: 'History' })}
      icon={
        permissions.isAuth &&
        isEditAllowed && (
          <SectionCreateButton
            isOpen={isFormVisible}
            onToggle={() => setIsFormVisible(!isFormVisible)}
            label={formatMessage({ id: 'New' })}
            tooltip={formatMessage({ id: 'Add a new history' })}
            openTooltip={formatMessage({ id: 'Cancel adding a new history' })}
          />
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
              {sortedHistoryItems}
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
