import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Divider, IconButton, List } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';

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
        ...data,
        entrance: entranceId,
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
          <IconButton
            color="primary"
            onClick={() => setIsFormVisible(!isFormVisible)}>
            {isFormVisible ? <RemoveCircleIcon /> : <AddCircleIcon />}
          </IconButton>
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
            <List>
              {histories.map(history => (
                <React.Fragment key={history.id}>
                  <History history={history} />
                  {histories.length > 1 && (
                    <Divider variant="middle" component="li" />
                  )}
                </React.Fragment>
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
