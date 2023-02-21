import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import CancelIcon from '@material-ui/icons/Cancel';

import styled from 'styled-components';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { descriptionsType } from './propTypes';
import Description from './Description';
import CreateDescriptionForm from '../Form/DescriptionForm';
import { postDescription } from '../../../actions/Description/CreateDescription';
import { usePermissions } from '../../../hooks';
import Alert from '../../common/Alert';

const ListStyled = styled(List)`
  border-top: 1px solid #e0e0e0;
`;
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
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new description' })
                : formatMessage({ id: 'Add a new description' })
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
              <CreateDescriptionForm isNewDescription onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {descriptions.length > 0 ? (
            <ListStyled dense disablePadding>
              {descriptions.map(description => (
                <Description description={description} key={description.id} />
              ))}
            </ListStyled>
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
