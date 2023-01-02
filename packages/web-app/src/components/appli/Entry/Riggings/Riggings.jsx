import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { IconButton, Divider, Tooltip } from '@mui/material';
import { useDispatch } from 'react-redux';
import React, { useState } from 'react';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import styled from 'styled-components';
import { usePermissions } from '../../../../hooks';
import { postRiggings } from '../../../../actions/Riggings/CreateRigging';
import CreateRiggingsForm from '../../Form/RiggingsForm/index';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Rigging from './Rigging';
import { riggingsType } from '../Provider';
import Alert from '../../../common/Alert';

const DividerWithMargin = styled(Divider)`
  margin-top: 16px;
  background-color: ${props => props.theme.palette.divider};
`;

const Riggings = ({ riggings, entranceId }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const handleSubmitForm = data => {
    dispatch(
      postRiggings({
        entrance: entranceId,
        title: data.title,
        obstacles: data.obstacles,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Riggings' })}
      icon={
        permissions.isAuth && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel' })
                : formatMessage({ id: 'Add a new riggings' })
            }>
            <IconButton
              color="primary"
              onClick={() => setIsFormVisible(!isFormVisible)}
              size="large">
              {isFormVisible ? <CancelIcon /> : <AddCircleIcon />}
            </IconButton>
          </Tooltip>
        )
      }
      content={
        <>
          {isFormVisible && (
            <>
              <CreateRiggingsForm
                closeForm={() => setIsFormVisible(false)}
                isNew
                onSubmit={handleSubmitForm}
              />
              <Divider />
            </>
          )}
          {riggings.length > 0 &&
            riggings
              .sort((r1, r2) => r1.title.localeCompare(r2.title))
              .map((rigging, index) => (
                <React.Fragment key={rigging.id}>
                  <Rigging rigging={rigging} />
                  {index < riggings.length - 1 && <DividerWithMargin />}
                </React.Fragment>
              ))}
          {riggings.length === 0 && (
            <Alert
              severity="info"
              content={formatMessage({
                id: 'There is currently no rigging for this entrance.'
              })}
            />
          )}
        </>
      }
    />
  );
};

Riggings.propTypes = {
  riggings: riggingsType,
  entranceId: PropTypes.number.isRequired
};

export default Riggings;
