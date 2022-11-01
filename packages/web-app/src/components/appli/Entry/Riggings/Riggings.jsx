import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { IconButton, Divider, Tooltip } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import React, { useState } from 'react';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import styled from 'styled-components';
import { usePermissions } from '../../../../hooks';
import { postRiggings } from '../../../../actions/Riggings/CreateRigging';
import CreateRiggingsForm from '../../Form/RiggingsForm/index';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Rigging from './Rigging';
import { riggingsType } from '../Provider';

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
    dispatch(postRiggings(data, entranceId, data.language.id, riggings.id));
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
              onClick={() => setIsFormVisible(!isFormVisible)}>
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

          {riggings
            ?.sort((r1, r2) => r1.title.localeCompare(r2.title))
            .map((rigging, index) => (
              <>
                <Rigging rigging={rigging} key={rigging.id} />
                {index < riggings.length - 1 && <DividerWithMargin />}
              </>
            ))}
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
