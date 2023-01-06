import { useIntl } from 'react-intl';
import {
  TableContainer,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography
} from '@material-ui/core';
import React from 'react';
import { isNil } from 'ramda';
import styled from 'styled-components';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover
}));

const RiggingTable = ({ obstacles, title }) => {
  const { formatMessage } = useIntl();

  if (isNil(obstacles[0]) || isNil(obstacles[0].obstacle)) {
    return (
      <Box my={3} mr="45px">
        <Typography variant="h4">{title}&nbsp;</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box my={3} mr="45px">
        <Typography variant="h4">{title}&nbsp;</Typography>
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

export default RiggingTable;
