import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Divider, IconButton, List } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { descriptionsType } from './propTypes';
import Description from './Description';
import CreateDescriptionForm from '../Form/DescriptionForm';
import { postDescription } from '../../../actions/Description/CreateDescription';
import { usePermissions } from '../../../hooks';
import Alert from '../../common/Alert';

const Descriptions = ({ entityType, entityId, descriptions }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      postDescription({
        [entityType]: entityId,
        title: data.title,
        body: data.body,
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
            onClick={() => setIsFormVisible(!isFormVisible)}
            size="large">
            {isFormVisible ? <CancelIcon /> : <AddCircleIcon />}
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
            <List dense disablePadding>
              {descriptions.map(description => (
                <Description description={description} key={description.id} />
              ))}
            </List>
          ) : (
            <Alert
              severity="info"
              content={formatMessage({
                id: `There is currently no description for this ${entityType}.`
              })}
            />
          )}
        </>
      }
    />
  );
};

Descriptions.propTypes = {
  entityType: PropTypes.oneOf(['entrance', 'cave', 'massif']),
  entityId: PropTypes.number.isRequired,
  descriptions: descriptionsType
};

export default Descriptions;
