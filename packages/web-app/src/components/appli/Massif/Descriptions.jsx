import React, { Fragment } from 'react';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import {
  Typography,
  Divider,
  ListItem,
  List,
  ListItemText,
  Box
} from '@material-ui/core';

const makeFormattedText = text =>
  text.split('\\n').map((item, key) => (
    // eslint-disable-next-line react/no-array-index-key
    <Fragment key={key}>
      {item}
      <br />
    </Fragment>
  ));

const Descriptions = ({ descriptions }) => {
  const { formatMessage, formatDate } = useIntl();

  return (
    <Box display="block">
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'Descriptions' })}
      </Typography>
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
                      {`${
                        !isNil(author.nickname)
                          ? formatMessage({ id: 'Posted by' })
                          : ''
                      } ${!isNil(author.nickname) ? author.nickname : ''} ${
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
    </Box>
  );
};

Descriptions.propTypes = {
  descriptions: PropTypes.arrayOf(
    PropTypes.shape({
      author: PropTypes.shape({
        name: PropTypes.string
      }),
      body: PropTypes.string,
      date: PropTypes.instanceOf(Date),
      id: PropTypes.number,
      language: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired
    })
  )
};

export default Descriptions;
