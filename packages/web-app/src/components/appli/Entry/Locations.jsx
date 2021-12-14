// eslint-disable-next-line react/prop-types
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import {
  Typography,
  Divider,
  ListItem,
  List,
  ListItemText
} from '@material-ui/core';
import React from 'react';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { locationsType } from './Provider';
import { makeFormattedText } from './utils';

const Locations = ({ locations }) => {
  const { formatMessage, formatDate } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Location' })}
      content={
        <List>
          {locations.map(({ id, title, body, author, creationDate }) => (
            <div key={id}>
              <ListItem>
                <ListItemText
                  primary={title}
                  secondary={
                    <>
                      <Typography variant="body2">
                        {makeFormattedText(body)}
                      </Typography>
                      <br />
                      <Typography
                        component="span"
                        variant="caption"
                        color="textPrimary">
                        {`${!isNil(author.nickname) &&
                          formatMessage({ id: 'Posted by' })} ${
                          author.nickname
                        } ${
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
              <Divider variant="middle" component="li" />
            </div>
          ))}
        </List>
      }
    />
  );
};

Locations.propTypes = {
  locations: locationsType
};

export default Locations;
