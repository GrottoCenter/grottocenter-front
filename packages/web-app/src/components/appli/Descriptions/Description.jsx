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
import { SnapshotButton } from '../Entry/Snapshots/UtilityFunction';

import { descriptionType } from './propTypes';
import CreateDescriptionForm from '../Form/DescriptionForm/index';
import { updateDescription } from '../../../actions/Description/UpdateDescription';
import { usePermissions } from '../../../hooks';
import Contribution from '../../common/Contribution/Contribution';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
  border-top: 1px solid ${props => props.theme.palette.divider};
`;
const Description = ({ description }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { id, author, reviewer, body, creationDate, reviewedDate, title } =
    description;
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      updateDescription({
        id: description.id,
        title: data.title,
        body: data.body,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };
  const { formatMessage } = useIntl();
  return (
    <ListItemStyled disableGutters alignItems="flex-start">
      <Box style={{ alignSelf: 'flex-end' }}>
        {!isFormVisible && (
          <ListItemIcon style={{ marginTop: 0 }}>
            <ButtonGroup color="primary">
              <Tooltip
                title={formatMessage({
                  id: 'Edit this description'
                })}>
                <Button
                  disabled={!permissions.isAuth}
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  color="primary"
                  aria-label="edit">
                  <EditIcon />
                </Button>
              </Tooltip>
              <SnapshotButton
                id={id}
                type="descriptions"
                content={description}
              />
            </ButtonGroup>
          </ListItemIcon>
        )}
      </Box>
      {isFormVisible && permissions.isAuth ? (
        <>
          <Box style={{ alignSelf: 'flex-end' }}>
            <ListItemIcon style={{ marginTop: 0 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setIsFormVisible(!isFormVisible)}
                aria-label="cancel">
                {formatMessage({ id: `Cancel` })}
              </Button>
            </ListItemIcon>
          </Box>
          <Box width="100%">
            <CreateDescriptionForm
              closeForm={() => setIsFormVisible(false)}
              isNewDescription={false}
              onSubmit={onSubmitForm}
              values={description}
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
              body={body}
              author={author}
              reviewer={reviewer}
              creationDate={creationDate}
              dateReviewed={reviewedDate}
            />
          }
        />
      )}
    </ListItemStyled>
  );
};

Description.propTypes = {
  description: descriptionType
};

export default Description;
