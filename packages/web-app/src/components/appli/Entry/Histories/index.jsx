import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import CancelIcon from '@material-ui/icons/Cancel';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { historiesType } from '../Provider';
import History from './History';
import CreateHistoryForm from '../../Form/HistoryForm';
import { postHistory } from '../../../../actions/History/CreateHistory';
import { usePermissions } from '../../../../hooks';
import Alert from '../../../common/Alert';

const Histories = ({ entranceId, histories }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      postHistory({
        entrance: entranceId,
        body: data.body,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'History' })}
      icon={
        permissions.isAuth && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new history' })
                : formatMessage({ id: 'Add a new history' })
            }>
            <Button
              color={isFormVisible ? '' : 'secondary'}
              variant="outlined"
              onClick={() => setIsFormVisible(!isFormVisible)}
              startIcon={isFormVisible ? <CancelIcon /> : <AddCircleIcon />}>
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
              {histories.map(history => (
                <History history={history} key={history.id} />
              ))}
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
  histories: historiesType
};

export default Histories;
