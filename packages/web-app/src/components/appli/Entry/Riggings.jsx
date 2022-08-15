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
import styled from 'styled-components';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { riggingsType, riggingType } from './Provider';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';

const MultilinesTableCell = styled(TableCell)({ whiteSpace: 'pre-wrap' });

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
              <MultilinesTableCell align="right">{anchor}</MultilinesTableCell>
              <MultilinesTableCell align="right">
                {observation}
              </MultilinesTableCell>
            </TableRow>
          ))}
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
          {riggings?.map((rigging, i) => (
            <div key={rigging.id}>
              <ListItem>
                <ListItemText
                  primary={<RiggingTable {...rigging} />}
                  secondary={
                    <AuthorAndDate
                      author={rigging.author}
                      date={rigging.date}
                    />
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
