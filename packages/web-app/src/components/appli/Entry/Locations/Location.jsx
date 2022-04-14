import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import { Typography, ListItem, ListItemText } from '@material-ui/core';
import React from 'react';
import { locationType } from '../Provider';
import { makeFormattedText } from '../utils';

const Location = ({ location }) => {
  const { formatMessage, formatDate } = useIntl();
  const { author, body, creationDate, title } = location;

  return (
    <ListItem>
      <ListItemText
        primary={title}
        secondary={
          <>
            <Typography variant="body2">{makeFormattedText(body)}</Typography>
            <br />
            <Typography component="span" variant="caption" color="textPrimary">
              {`${!isNil(author.nickname) &&
                formatMessage({ id: 'Posted by' })} ${author.nickname} ${
                !isNil(creationDate)
                  ? `- ${formatDate(creationDate, {
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
    </ListItem>
  );
};

Location.propTypes = {
  location: locationType
};

export default Location;
