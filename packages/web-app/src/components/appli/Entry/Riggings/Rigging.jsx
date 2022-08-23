import { useIntl } from 'react-intl';
import {
  TableContainer,
  Box,
  Table,
  TableHead,
  IconButton,
  TableRow,
  TableCell,
  TableBody,
  ListItemIcon,
  Divider,
  ListItem,
  ListItemText,
  Typography
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useDispatch } from 'react-redux';
import CancelIcon from '@material-ui/icons/Cancel';
import React, { useState } from 'react';
import { isNil } from 'ramda';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { usePermissions } from '../../../../hooks';
import { updateRiggings } from '../../../../actions/Riggings/UpdateRigging';
import CreateRiggingsForm from '../../Form/RiggingsForm/index';
import { riggingsType, riggingType } from '../Provider';
import AuthorAndDate from '../../../common/Contribution/AuthorAndDate';

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

const Rigging = ({ riggings, rigging, index }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const onSubmitForm = data => {
    dispatch(
      updateRiggings({
        ...data,
        language: data.language.id,
        riggings: riggings.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <div key={rigging.id}>
      <ListItem>
        {isFormVisible && permissions.isAuth ? (
          <Box width="100%">
            <CreateRiggingsForm
              closeForm={() => setIsFormVisible(false)}
              isNewComment={false}
              onSubmit={onSubmitForm}
              values={rigging}
            />
          </Box>
        ) : (
          <ListItemText
            primary={<RiggingTable {...rigging} />}
            secondary={
              <AuthorAndDate author={rigging.author} date={rigging.date} />
            }
          />
        )}
        {permissions.isAuth && (
          <ListItemIcon style={{ alignSelf: 'start' }}>
            <IconButton
              onClick={() => setIsFormVisible(!isFormVisible)}
              color="primary"
              aria-label="edit">
              {isFormVisible ? <CancelIcon /> : <EditIcon />}
            </IconButton>
          </ListItemIcon>
        )}
      </ListItem>
      {index < riggings.length - 1 && (
        <Divider variant="middle" component="li" />
      )}
    </div>
  );
};

RiggingTable.propTypes = { ...riggingType };

Rigging.propTypes = {
  riggings: riggingsType,
  rigging: riggingType,
  index: PropTypes.number.isRequired
};

export default Rigging;
