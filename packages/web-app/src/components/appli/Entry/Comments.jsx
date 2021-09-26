import { useIntl } from 'react-intl';
import {
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography,
  ListItemIcon
} from '@material-ui/core';
import React from 'react';
import { isNil } from 'ramda';
import styled from 'styled-components';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { commentsType, commentType } from './Provider';
import Ratings from './Ratings';
import { makeFormattedText } from './utils';

const StyledListItemText = styled(ListItemText)`
  width: 100%;
  padding-right: ${({ theme }) => theme.spacing(2)}px;
`;

const StyledListItemIcon = styled(ListItemIcon)`
  flex-shrink: 1;
  justify-content: flex-end;
`;

const Comment = ({
  title,
  body,
  author,
  interestRate,
  progressionRate,
  accessRate,
  date
}) => {
  const { formatMessage, formatDate } = useIntl();
  const formattedBody = makeFormattedText(body);

  return (
    <ListItem>
      <StyledListItemText
        primary={title}
        secondary={
          <>
            <Typography variant="body2">{formattedBody}</Typography>
            <br />
            <Typography component="span" variant="caption" color="textPrimary">
              {`${!isNil(author.name) && formatMessage({ id: 'Posted by' })} ${
                author.name
              } ${
                !isNil(date)
                  ? `- ${formatDate(date, {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric'
                    })}`
                  : ''
              }`}
            </Typography>
          </>
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
          {comments.map(
            (
              {
                accessRate,
                author,
                body,
                date,
                id,
                interestRate,
                progressionRate,
                title
              },
              i
            ) => (
              <div key={id}>
                <Comment
                  title={title}
                  body={body}
                  author={author}
                  interestRate={interestRate}
                  progressionRate={progressionRate}
                  accessRate={accessRate}
                  date={date}
                />
                {i < comments.length - 1 && (
                  <Divider variant="middle" component="li" />
                )}
              </div>
            )
          )}
        </List>
      }
    />
  );
};

Comment.propTypes = commentType;

Comments.propTypes = {
  comments: commentsType
};

export default Comments;
