import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Divider, IconButton, List } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { descriptionsType } from '../Provider';
import Description from './Description';
import CreateDescriptionForm from '../../Form/DescriptionForm';
import { postDescription } from '../../../../actions/Description/CreateDescription';
import { usePermissions } from '../../../../hooks';
import Alert from '../../../common/Alert';

const Descriptions = ({ entranceId, descriptions }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      postDescription({
        ...data,
        entranceId,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Description' })}
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
              <CreateDescriptionForm isNewDescription onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {descriptions.length > 0 ? (
            <List>
              {descriptions.map(description => (
                <React.Fragment key={description.id}>
                  <Description description={description} />
                  {descriptions.length > 1 && (
                    <Divider variant="middle" component="li" />
                  )}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert
              severity="info"
              content={formatMessage({
                id: 'There is currently no description for this entrance.'
              })}
            />
          )}
        </>
      }
    />
  );
};

Descriptions.propTypes = {
  entranceId: PropTypes.number.isRequired,
  descriptions: descriptionsType
};

export default Descriptions;
