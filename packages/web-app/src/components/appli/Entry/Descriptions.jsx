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
import { descriptionsType } from './Provider';
import { makeFormattedText } from './utils';

const Descriptions = ({ descriptions }) => {
  const { formatMessage, formatDate } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Descriptions' })}
      content={
        <List>
          {descriptions.map(({ id, title, body, author, date }) => (
            <div key={id}>
              <ListItem>
                <ListItemText
                  disableTypography
                  primary={<Typography>{title}</Typography>}
                  secondary={
                    <>
                      <Typography variant="body2" color="textSecondary">
                        {makeFormattedText(body)}
                      </Typography>
                      <br />
                      <Typography variant="caption">
                        {`${!isNil(author.nickname) &&
                          formatMessage({ id: 'Posted by' })} ${
                          author.nickname
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
              </ListItem>
              <Divider variant="middle" component="li" />
            </div>
          ))}
        </List>
      }
    />
  );
};

Descriptions.propTypes = {
  descriptions: descriptionsType
};

export default Descriptions;
