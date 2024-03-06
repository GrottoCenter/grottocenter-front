import {
  ListItem,
  Box,
  ListItemText,
  ListItemIcon,
  Typography,
  ButtonGroup,
  Tooltip,
  Button
} from '@mui/material';
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import { useDispatch } from 'react-redux';
import { isEmpty, pathOr } from 'ramda';
import { useIntl } from 'react-intl';
import { usePermissions, useUserProperties } from '../../../../hooks';
import { updateComment } from '../../../../actions/Comment/UpdateComment';
import CreateCommentForm from '../../Form/CommentForm/index';
import { commentType } from '../Provider';
import Ratings from '../Ratings';
import Contribution from '../../../common/Contribution/Contribution';
import Duration from '../../../common/Properties/Duration';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const ListItemStyled = styled(ListItem)`
  flex-direction: column;
  border-top: 1px solid ${props => props.theme.palette.divider};
`;

const StyledListItemText = styled(ListItemText)`
  width: 100%;
  padding-right: ${({ theme }) => theme.spacing(2)};
`;

const StyledListItemIcon = styled(ListItemIcon)`
  width: 100%;
  flex-direction: column;
`;
const StyledRatings = styled(Ratings)`
  gap: 20px;
  padding-bottom: 10px;
`;
const DurationContainer = styled('div')`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  gap: 20px;
`;
const Comment = ({ comment }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const {
    id,
    title,
    body,
    author,
    reviewer,
    interest,
    progression,
    access,
    creationDate,
    dateReviewed,
    eTTrail,
    eTUnderground
  } = comment;
  const [isFormVisible, setIsFormVisible] = useState(false);
  const onSubmitForm = data => {
    dispatch(
      updateComment({
        id: data.id,
        title: data.title,
        body: data.body,
        aestheticism: data.interest,
        caving: data.progression,
        approach: data.access,
        eTTrail: data.eTTrail,
        eTUnderground: data.eTUnderground,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };
  const userId = pathOr(null, ['id'], useUserProperties());
  const canEdit =
    (author?.id && userId?.toString() === author?.id.toString()) ||
    permissions.isAdmin ||
    permissions.isModerator;
  const { formatMessage } = useIntl();
  return (
    <ListItemStyled disableGutters alignItems="flex-start">
      <Box style={{ alignSelf: 'flex-end' }}>
        {!isFormVisible && (
          <ListItemIcon style={{ marginTop: 0 }}>
            <ButtonGroup color="primary">
              <Tooltip
                title={formatMessage({
                  id: 'Edit this comment'
                })}>
                <Button
                  disabled={!permissions.isAuth || !canEdit}
                  onClick={() => setIsFormVisible(!isFormVisible)}
                  color="primary"
                  aria-label="edit">
                  <EditIcon />
                </Button>
              </Tooltip>
              <SnapshotButton id={id} type="comments" content={comment} />
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
            <CreateCommentForm
              closeForm={() => setIsFormVisible(false)}
              isNewComment={false}
              onSubmit={onSubmitForm}
              values={comment}
            />
          </Box>
        </>
      ) : (
        <>
          <StyledListItemText
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
                body={body}
                creationDate={creationDate}
                reviewer={reviewer}
                dateReviewed={dateReviewed}
              />
            }
          />
          <StyledListItemIcon>
            <StyledRatings
              interest={interest}
              progression={progression}
              access={access}
              size="small"
            />
            <DurationContainer>
              {!!eTTrail && !isEmpty(eTTrail) && (
                <Duration
                  image="/images/time-to-go.svg"
                  durationStr={eTTrail}
                  title="Time to go"
                />
              )}
              {!!eTUnderground && !isEmpty(eTUnderground) && (
                <Duration
                  image="/images/underground_time.svg"
                  durationStr={eTUnderground}
                  title="Underground time"
                />
              )}
            </DurationContainer>
          </StyledListItemIcon>
        </>
      )}
    </ListItemStyled>
  );
};

Comment.propTypes = {
  comment: commentType
};

export default Comment;
