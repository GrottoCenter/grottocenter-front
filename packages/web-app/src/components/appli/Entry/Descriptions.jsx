// eslint-disable-next-line react/prop-types
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import {
  Typography,
  Divider,
  ListItem,
  List,
  ListItemText
} from '@material-ui/core';
import React from 'react';
import { useSelector } from 'react-redux';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { descriptionsType } from './Provider';
import { detailPageV2Links } from '../../../conf/Config';
import { makeFormattedText } from './utils';

const Descriptions = ({ descriptions, entryId }) => {
  const { formatMessage, formatDate } = useIntl();
  const { locale } = useSelector(state => state.intl);

  const externalLink = `${
    detailPageV2Links[locale] !== undefined
      ? detailPageV2Links[locale]
      : detailPageV2Links['*']
  }&category=entry&id=${entryId}`;

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Description' })}
      content={
        <List>
          {descriptions.map(({ id, title, body, author, date }) => (
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
          <ListItem>
            <ListItemText
              secondary={
                <>
                  {formatMessage({ id: 'For more details please visit' })}
                  &nbsp;
                  <a
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer">
                    Grottocenter V2
                  </a>
                </>
              }
            />
          </ListItem>
        </List>
      }
    />
  );
};

Descriptions.propTypes = {
  descriptions: descriptionsType,
  entryId: PropTypes.string
};

export default Descriptions;
