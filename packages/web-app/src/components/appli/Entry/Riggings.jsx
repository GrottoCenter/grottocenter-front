// eslint-disable-next-line react/prop-types
import { useIntl } from 'react-intl';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  Divider,
  ListItem,
  ListItemText,
  Typography
} from '@material-ui/core';
import React from 'react';
import { isNil } from 'ramda';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { riggingsType, riggingType } from './Provider';
import makeFormattedText from './utils';

const RiggingTable = ({ obstacles, title }) => {
  const { formatMessage } = useIntl();

  if (isNil(obstacles[0]) || isNil(obstacles[0].obstacle)) {
    return null;
  }

  return (
    <TableContainer>
      <Typography variant="subtitle1">{title}</Typography>
      <Table size="small" aria-label="riggings">
        <TableHead>
          <TableRow>
            <TableCell>{formatMessage({ id: 'obstacles' })}</TableCell>
            <TableCell align="right">
              {formatMessage({ id: 'ropes' })}
            </TableCell>
            <TableCell align="right">
              {formatMessage({ id: 'anchors' })}
            </TableCell>
            <TableCell align="right">
              {formatMessage({ id: 'observations' })}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {obstacles?.map(({ obstacle, rope, anchor, observation }) => (
            <TableRow key={obstacle + rope + anchor}>
              <TableCell component="th" scope="row">
                {obstacle}
              </TableCell>
              <TableCell align="right">{rope}</TableCell>
              <TableCell align="right">{makeFormattedText(anchor)}</TableCell>
              <TableCell align="right">
                {makeFormattedText(observation)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Riggings = ({ riggings }) => {
  const { formatMessage, formatDate } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Riggings' })}
      content={
        <List>
          {riggings?.map((rigging, i) => (
            <div key={rigging.id}>
              <ListItem primary="test">
                <ListItemText
                  primary={<RiggingTable {...rigging} />}
                  secondary={
                    <Typography
                      component="span"
                      variant="caption"
                      color="textPrimary">
                      {`${!isNil(rigging.author?.nickname) &&
                        formatMessage({ id: 'Posted by' })} ${
                        rigging.author.nickname
                      } ${
                        !isNil(rigging.date)
                          ? `- ${formatDate(rigging.date, {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: 'numeric'
                            })}`
                          : ''
                      }`}
                    </Typography>
                  }
                />
              </ListItem>
              {i < riggings.length - 1 && (
                <Divider variant="middle" component="li" />
              )}
            </div>
          ))}
        </List>
      }
    />
  );
};

Riggings.propTypes = {
  riggings: riggingsType
};

RiggingTable.propTypes = { ...riggingType };

export default Riggings;
