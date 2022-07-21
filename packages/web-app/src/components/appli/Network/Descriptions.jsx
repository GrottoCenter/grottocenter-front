import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import {
  Typography,
  Divider,
  ListItem,
  List,
  ListItemText
} from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { CaveContext } from './Provider';
import Alert from '../../common/Alert';

const LoadingList = () => (
  <>
    <Skeleton />
    <Skeleton />
    <Skeleton />
  </>
);

const Descriptions = () => {
  const { formatMessage, formatDate } = useIntl();
  const {
    state: {
      cave: { descriptions },
      loading
    }
  } = useContext(CaveContext);

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Descriptions' })}
      content={
        <List>
          {/* eslint-disable-next-line no-nested-ternary */}
          {loading ? (
            <LoadingList />
          ) : descriptions && descriptions.length > 0 ? (
            descriptions.map(({ id, title, body, author, date }) => (
              <div key={id}>
                <ListItem>
                  <ListItemText
                    disableTypography
                    primary={<Typography>{title}</Typography>}
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          style={{ whiteSpace: 'pre-wrap' }}>
                          {body}
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
            ))
          ) : (
            <Alert
              severity="info"
              title={formatMessage({
                id: 'There is currently no description for this network.'
              })}
            />
          )}
        </List>
      }
    />
  );
};

export default Descriptions;
