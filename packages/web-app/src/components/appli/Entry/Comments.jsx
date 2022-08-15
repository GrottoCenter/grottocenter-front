import { useIntl } from 'react-intl';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@material-ui/core';
import React from 'react';
import styled from 'styled-components';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { commentsType, commentType } from './Provider';
import Ratings from './Ratings';
import Contribution from '../../common/Contribution/Contribution';

const StyledListItemText = styled(ListItemText)`
  width: 100%;
  padding-right: ${({ theme }) => theme.spacing(2)}px;
`;

const StyledListItemIcon = styled(ListItemIcon)`
  flex-shrink: 1;
  justify-content: flex-end;
`;

const Comment = ({ comment }) => {
  const {
    title,
    body,
    author,
    interestRate,
    progressionRate,
    accessRate,
    date
  } = comment;

  return (
    <ListItem>
      <StyledListItemText
        primary={title}
        secondary={
          <Contribution author={author} body={body} creationDate={date} />
        }
      />
      <StyledListItemIcon>
        <Ratings
          interestRate={interestRate}
          progressionRate={progressionRate}
          accessRate={accessRate}
          size="small"
        />
      </StyledListItemIcon>
    </ListItem>
  );
};

const Comments = ({ comments }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Comments' })}
      content={
        <List>
          {comments.map((comment, i) => (
            <div key={comment.id}>
              <Comment comment={comment} />
              {i < comments.length - 1 && (
                <Divider variant="middle" component="li" />
              )}
            </div>
          ))}
        </List>
      }
    />
  );
};

Comment.propTypes = {
  comment: commentType
};

Comments.propTypes = {
  comments: commentsType
};

export default Comments;
