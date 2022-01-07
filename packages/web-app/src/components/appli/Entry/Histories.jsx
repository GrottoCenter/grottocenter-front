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
import { historiesType, historyType } from './Provider';
import { makeFormattedText } from './utils';

const History = ({ id, title, body, author, date }) => {
  const { formatMessage, formatDate } = useIntl();

  return (
    <div key={id}>
      <ListItem>
        <ListItemText
          primary={title}
          secondary={
            <>
              <Typography variant="body2">{makeFormattedText(body)}</Typography>
              <br />
              <Typography
                component="span"
                variant="caption"
                color="textPrimary">
                {`${!isNil(author.nickname) &&
                  formatMessage({ id: 'Posted by' })} ${author.nickname} ${
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
  );
};

const Histories = ({ histories }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'History' })}
      content={<List>{histories.map(History)}</List>}
    />
  );
};

History.propTypes = historyType;

Histories.propTypes = {
  histories: historiesType
};

export default Histories;