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
} from '@mui/material';
import React from 'react';
import { isNil } from 'ramda';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { obstacleType } from '../Provider';
import { HighLightsLine } from '../../../common/Highlights';

const StyledTable = styled(Table)`
  border-left: 1px solid ${props => props.theme.palette.primary.veryLight};
`;
const StyledTableRow = styled(TableRow)`
  background-color: ${props => props.theme.palette.action.hover};
`;
const StyledTableContainer = styled(TableContainer)`
  overflow-wrap: anywhere;
  overflow: scroll;
`;
const StyledTableCell = styled(TableCell)`
  border: 1px solid ${props => props.theme.palette.primary.veryLight};
  padding: 6px !important;
  min-width: 40px;
  ${props => ({
    [props.theme.breakpoints.down('md')]: {
      fontSize: '10px'
    }
  })};
`;

const HighligtedTableCell = ({ data, oldData }) => (
  <StyledTableCell component="th" scope="row">
    <span style={{ whiteSpace: 'pre-line' }}>
      {oldData ? <HighLightsLine newText={data} oldText={oldData} /> : data}
    </span>
  </StyledTableCell>
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
      <StyledTableContainer>
        <StyledTable size="small" aria-label="riggings">
          <TableHead>
            <TableRow>
              <StyledTableCell>
                {formatMessage({ id: 'obstacles' })}
              </StyledTableCell>
              <StyledTableCell>
                {formatMessage({ id: 'ropes' })}
              </StyledTableCell>
              <StyledTableCell>
                {formatMessage({ id: 'anchors' })}
              </StyledTableCell>
              <StyledTableCell>
                {formatMessage({ id: 'observations' })}
              </StyledTableCell>
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
        </StyledTable>
      </StyledTableContainer>
    </Box>
  );
};

RiggingTable.propTypes = {
  obstacles: PropTypes.arrayOf(obstacleType),
  previous: PropTypes.arrayOf(obstacleType),
  title: PropTypes.string.isRequired
};

export default RiggingTable;
