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
  Typography,
  Tooltip
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
import { riggingType, obstacleType } from '../Provider';
import Contribution from '../../../common/Contribution/Contribution';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover
}));

const RiggingTable = ({ obstacles, title }) => {
  const { formatMessage } = useIntl();

  if (isNil(obstacles[0]) || isNil(obstacles[0].obstacle)) {
    return (
      <Box my={3} mr="45px">
        <Typography variant="h4">{title}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box my={3} mr="45px">
        <Typography variant="h4">{title}</Typography>
      </Box>
      <TableContainer>
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
            {obstacles?.map(
              ({ obstacle, rope, anchor, observation }, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <StyledTableRow key={`${obstacle}${rope}${anchor}${index}`}>
                  <TableCell component="th" scope="row">
                    <span style={{ whiteSpace: 'pre-line' }}>{obstacle}</span>
                  </TableCell>
                  <TableCell align="right">
                    <span style={{ whiteSpace: 'pre-line' }}>{rope}</span>
                  </TableCell>
                  <TableCell align="right">
                    <span style={{ whiteSpace: 'pre-line' }}>{anchor}</span>
                  </TableCell>
                  <TableCell align="right">
                    <span style={{ whiteSpace: 'pre-line' }}>
                      {observation}
                    </span>
                  </TableCell>
                </StyledTableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

const Rigging = ({ rigging }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const onSubmitForm = data => {
    dispatch(
      updateRiggings({
        ...data,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <Box key={rigging.id} position="relative">
      {permissions.isAuth && (
        <Box align="right" position="absolute" right="0">
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel edit' })
                : formatMessage({ id: 'Edit these riggings' })
            }>
            <IconButton
              onClick={() => setIsFormVisible(!isFormVisible)}
              color="primary"
              aria-label="edit">
              {isFormVisible ? <CancelIcon /> : <EditIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}
      {isFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateRiggingsForm
            closeForm={() => setIsFormVisible(false)}
            isNew={false}
            onSubmit={onSubmitForm}
            values={rigging}
          />
        </Box>
      ) : (
        <Box>
          <RiggingTable {...rigging} />
          <Contribution
            author={rigging.author}
            creationDate={rigging.date}
            reviewer={rigging.reviewer}
            dateReviewed={rigging.dateReviewed}
          />
        </Box>
      )}
    </Box>
  );
};

RiggingTable.propTypes = {
  obstacles: PropTypes.arrayOf(obstacleType),
  title: PropTypes.string.isRequired
};

Rigging.propTypes = {
  rigging: riggingType
};

export default Rigging;
