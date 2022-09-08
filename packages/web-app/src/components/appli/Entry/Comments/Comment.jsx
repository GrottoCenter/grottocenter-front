import {
  ListItem,
  IconButton,
  Box,
  ListItemText,
  ListItemIcon
} from '@material-ui/core';
import React, { useState } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';
import { useDispatch } from 'react-redux';
import CancelIcon from '@material-ui/icons/Cancel';
import { isEmpty, pathOr } from 'ramda';
import { usePermissions, useUserProperties } from '../../../../hooks';
import { updateComment } from '../../../../actions/Comment/UpdateComment';
import CreateCommentForm from '../../Form/CommentForm/index';
import { commentType } from '../Provider';
import Ratings from '../Ratings';
import Contribution from '../../../common/Contribution/Contribution';
import Duration from '../../../common/Properties/Duration';

const StyledListItemText = styled(ListItemText)`
  width: 100%;
  padding-right: ${({ theme }) => theme.spacing(2)}px;
`;

const StyledListItemIcon = styled(ListItemIcon)`
  flex-shrink: 1;
  justify-content: flex-end;
  flex-direction: column;
`;

const Comment = ({ comment }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const {
    title,
    body,
    author,
    reviewer,
    interestRate,
    progressionRate,
    accessRate,
    date,
    dateReviewed,
    eTTrail,
    eTUnderground
  } = comment;
  const [isFormVisible, setIsFormVisible] = useState(false);
  const onSubmitForm = data => {
    dispatch(
      updateComment({
        ...data,
        language: data.language.id,
        comment: comment.id
      })
    );
    setIsFormVisible(false);
  };
  const userId = pathOr(null, ['id'], useUserProperties());
  const canEdit =
    userId?.toString() === comment?.author.id.toString() ||
    permissions.isAdmin ||
    permissions.isModerator;

  return (
    <ListItem>
      {isFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateCommentForm
            closeForm={() => setIsFormVisible(false)}
            isNewComment={false}
            onSubmit={onSubmitForm}
            values={comment}
          />
        </Box>
      ) : (
        <ListItem>
          <StyledListItemText
            primary={title}
            secondary={
              <Contribution
                author={author}
                body={body}
                creationDate={date}
                reviewer={reviewer}
                dateReviewed={dateReviewed}
              />
            }
          />
          <StyledListItemIcon>
            <Ratings
              interestRate={interestRate}
              progressionRate={progressionRate}
              accessRate={accessRate}
              size="small"
            />
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
          </StyledListItemIcon>
        </ListItem>
      )}
      {canEdit && (
        <ListItemIcon style={{ alignSelf: 'start' }}>
          <IconButton
            onClick={() => setIsFormVisible(!isFormVisible)}
            color="primary"
            aria-label="edit">
            {isFormVisible ? <CancelIcon /> : <EditIcon />}
          </IconButton>
        </ListItemIcon>
      )}
    </ListItem>
  );
};

Comment.propTypes = {
  comment: commentType
};

export default Comment;
