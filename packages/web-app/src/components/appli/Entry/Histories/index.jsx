import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import ContributionSection from '@/components/appli/Contributions/ContributionSection';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import { HistoryPropTypes } from '../../../../types/entrance.type';
import History from './History';
import CreateHistoryForm from '../../EntitiesForm/History';
import {
  useCreateHistory,
  useMoveHistoryRelevance,
  usePermissions
} from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
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

  return (
    <ContributionSection
      anchorId="history"
      title={formatMessage({ id: 'History' })}
      items={histories}
      renderItem={(history, { isFirst, isLast }) => (
        <History
          history={history}
          entranceId={entranceId}
          isEditAllowed={isEditAllowed}
          isMoving={movingId === history.id}
          onMoveUp={() => handleMove(history.id, -1)}
          onMoveDown={() => handleMove(history.id, 1)}
          isFirst={isFirst}
          isLast={isLast}
        />
      )}
      createAction={
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
      form={
        isFormVisible ? (
          <CreateHistoryForm isNewHistory onSubmit={onSubmitForm} />
        ) : null
      }
      emptyState={
        <Alert
          severity="info"
          content={formatMessage({
            id: 'There is currently no history for this entrance.'
          })}
        />
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
