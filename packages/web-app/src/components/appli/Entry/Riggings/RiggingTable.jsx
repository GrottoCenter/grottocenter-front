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
import PropTypes from 'prop-types';
import { obstacleType } from '../Provider';
import { HighLightsLine } from '../../../common/Highlights';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  backgroundColor: theme.palette.action.hover
}));

const HighligtedTableCell = ({ data, oldData }) => (
  <TableCell component="th" scope="row">
    <span style={{ whiteSpace: 'pre-line' }}>
      {oldData ? <HighLightsLine newText={data} oldText={oldData} /> : data}
    </span>
  </TableCell>
);

HighligtedTableCell.propTypes = {
  data: PropTypes.string.isRequired,
  oldData: PropTypes.string
};

const RiggingTable = ({ obstacles, title, previous }) => {
  const { formatMessage } = useIntl();
  const previousObstacles = previous?.obstacles;
  if (isNil(obstacles[0]) || isNil(obstacles[0].obstacle)) {
    return (
      <Box mb={3}>
        <Typography variant="h4">{title}&nbsp;</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
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
              ({ obstacle, rope, anchor, observation }, index) => {
                const oldData = previousObstacles
                  ? previousObstacles[index]
                  : undefined;
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <StyledTableRow key={`${obstacle}${rope}${anchor}${index}`}>
                    <HighligtedTableCell
                      data={obstacle}
                      oldData={oldData?.obstacle}
                    />
                    <HighligtedTableCell data={rope} oldData={oldData?.rope} />
                    <HighligtedTableCell
                      data={anchor}
                      oldData={oldData?.anchor}
                    />
                    <HighligtedTableCell
                      data={observation}
                      oldData={oldData?.observation}
                    />
                  </StyledTableRow>
                );
              }
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

RiggingTable.propTypes = {
  obstacles: PropTypes.arrayOf(obstacleType),
  previous: PropTypes.arrayOf(obstacleType),
  title: PropTypes.string.isRequired
};

export default RiggingTable;
