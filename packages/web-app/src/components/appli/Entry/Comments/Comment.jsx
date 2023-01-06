import {
  ListItem,
  IconButton,
  Box,
  ListItemText,
  ListItemIcon,
  Typography
} from '@material-ui/core';
import React, { useState } from 'react';
import styled from 'styled-components';
import EditIcon from '@material-ui/icons/Edit';
import { useDispatch } from 'react-redux';
import CancelIcon from '@material-ui/icons/Cancel';
import { isEmpty, pathOr } from 'ramda';
import HistoryIcon from '@material-ui/icons/History';
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

  return (
    <ListItem disableGutters divider alignItems="flex-start">
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
        <>
          <StyledListItemText
            disableTypography
            primary={<Typography variant="h4">{title}</Typography>}
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
            <Ratings
              interest={interest}
              progression={progression}
              access={access}
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
        </>
      )}
      {canEdit && (
        <ListItemIcon style={{ alignSelf: 'start' }}>
          <IconButton
            onClick={() => setIsFormVisible(!isFormVisible)}
            color="primary"
            aria-label="edit">
            {isFormVisible ? <CancelIcon /> : <EditIcon />}
          </IconButton>
          <IconButton href={`/ui/comments/${id}/snapshots`} color="primary">
            <HistoryIcon />
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
