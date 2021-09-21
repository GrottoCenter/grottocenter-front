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

const RiggingTable = ({ anchors, observations, obstacles, ropes, title }) => {
  const { formatMessage } = useIntl();

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
          <TableRow>
            <TableCell component="th" scope="row">
              {obstacles}
            </TableCell>
            <TableCell align="right">{ropes}</TableCell>
            <TableCell align="right">{anchors}</TableCell>
            <TableCell align="right">{observations}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const Riggings = ({ riggings }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Riggings' })}
      content={
        <List>
          {riggings.map((rigging, i) => (
            <div key={rigging.id}>
              <ListItem primary="test">
                <ListItemText
                  primary={<RiggingTable {...rigging} />}
                  secondary={
                    <Typography
                      component="span"
                      variant="caption"
                      color="textPrimary">
                      {`${!isNil(rigging.author.name) &&
                        formatMessage({ id: 'Posted by' })} ${
                        rigging.author.name
                      } ${!isNil(rigging.date) ? `- ${rigging.date}` : ''}`}
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
