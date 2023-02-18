import React, { useState } from 'react';
import {
  Box,
  ListItemIcon,
  ListItem,
  ListItemText,
  Typography,
  ButtonGroup,
  Button,
  Tooltip
} from '@material-ui/core';
import { useDispatch } from 'react-redux';
import EditIcon from '@material-ui/icons/Edit';

import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { locationType } from '../Provider';
import CreateLocationForm from '../../Form/LocationForm/index';
import { updateLocation } from '../../../../actions/Location/UpdateLocation';
import { usePermissions } from '../../../../hooks';
import Contribution from '../../../common/Contribution/Contribution';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
`;
const Location = ({ location }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { id, title, body, author, reviewer, creationDate, reviewedDate } =
    location;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateLocation({
        id: data.id,
        title: data.title,
        body: data.body,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };
  const { formatMessage } = useIntl();
  return (
    <ListItemStyled disableGutters divider alignItems="flex-start">
      <Box sx={{ alignSelf: 'flex-end' }}>
        {!isFormVisible && (
          <ListItemIcon style={{ marginTop: 0 }}>
            <ButtonGroup color="primary">
              <Tooltip
                title={formatMessage({
                  id: 'Edit this location'
                })}>
                <Button
                  disabled={!permissions.isAuth}
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  color="primary"
                  aria-label="edit">
                  <EditIcon />
                </Button>
              </Tooltip>
              <SnapshotButton id={id} type="locations" content={location} />
            </ButtonGroup>
          </ListItemIcon>
        )}
      </Box>
      {isFormVisible ? (
        <>
          <Box sx={{ alignSelf: 'flex-end' }}>
            {permissions.isAuth && (
              <ListItemIcon style={{ marginTop: 0 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  aria-label="cancel">
                  {formatMessage({ id: `Cancel` })}
                </Button>
              </ListItemIcon>
            )}
          </Box>
          <Box width="100%">
            <CreateLocationForm
              closeForm={() => setIsFormVisible(false)}
              isNewLocation={false}
              onSubmit={onSubmitForm}
              values={location}
            />
          </Box>
        </>
      ) : (
        <ListItemText
          style={{ margin: 0 }}
          disableTypography
          primary={
            <Typography variant="h4" style={{ marginBottom: 7 }}>
              {title}
            </Typography>
          }
          secondary={
            <Contribution
              author={author}
              reviewer={reviewer}
              body={body}
              creationDate={creationDate}
              dateReviewed={reviewedDate}
            />
          }
        />
      )}
    </ListItemStyled>
  );
};

Location.propTypes = {
  location: locationType
};

export default Location;
