import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { DescriptionPropTypes } from '../../../types/description.type';
import Description from './Description';
import CreateDescriptionForm from '../Form/DescriptionForm';
import { postDescription } from '../../../actions/Description/CreateDescription';
import { usePermissions } from '../../../hooks';
import Alert from '../../common/Alert';

const Descriptions = ({
  entityType,
  entityId,
  descriptions,
  isEditAllowed = true
}) => {
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
        permissions.isAuth &&
        isEditAllowed && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new description' })
                : formatMessage({ id: 'Add a new description' })
            }>
            <Button
              color={isFormVisible ? 'inherit' : 'secondary'}
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
              <CreateDescriptionForm isNewDescription onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {descriptions.length > 0 ? (
            <List dense disablePadding>
              {descriptions.map(description => (
                <Description
                  description={description}
                  isEditAllowed={isEditAllowed}
                  key={description.id}
                />
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
  descriptions: PropTypes.arrayOf(DescriptionPropTypes),
  isEditAllowed: PropTypes.bool
};

export default Descriptions;
