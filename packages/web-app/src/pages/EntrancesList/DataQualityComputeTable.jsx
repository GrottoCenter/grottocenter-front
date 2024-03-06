import React from 'react';
import { useTheme, styled } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import { useIntl } from 'react-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Paper
} from '@mui/material';

const useStyles = makeStyles({
  table: {
    minWidth: 400
  },
  ul: {
    display: 'flex'
  }
});

const StyledCell = styled(TableCell)({
  component: 'th',
  scope: 'row'
});

const StyledCellBold = styled(StyledCell)({
  fontWeight: 700
});

function createData(
  name,
  absent,
  one,
  twoAndMore,
  moreThan10,
  between5and10,
  between2and5,
  lessThan2
) {
  return {
    name,
    absent,
    one,
    twoAndMore,
    moreThan10,
    between5and10,
    between2and5,
    lessThan2
  };
}

// Define the rows used to display the computation of the data quality in the table
const rows = [
  createData('General data on the cave', '-', 3, 8, 1, 3, 5, 8),
  createData('Location', 0, 3, 7, 1, 3, 5, 7),
  createData('Description', 0, 3, 7, 1, 3, 5, 7),
  createData('Document', 0, 3, 7, 1, 3, 5, 7),
  createData('Rigging', 0, 3, 7, 1, 3, 5, 7),
  createData('History', 0, 3, 7, 1, 3, 5, 7),
  createData('Comment', 0, 3, 7, 1, 3, 5, 7)
];

// Compute the total values
const getTotal = () => {
  const total = createData('Total', 0, 0, 0, 0, 0, 0, 0);
  rows.forEach(row => {
    total.absent += Number.isNaN(Number(row.absent)) ? 0 : row.absent;
    total.one += row.one;
    total.twoAndMore += row.twoAndMore;
    total.moreThan10 += row.moreThan10;
    total.between5and10 += row.between5and10;
    total.between2and5 += row.between2and5;
    total.lessThan2 += row.lessThan2;
  });
  return total;
};

const DataQualityComputeTable = () => {
  const classes = useStyles();
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const total = getTotal();

  return (
    <TableContainer
      style={{
        margin: '0 auto',
        width: 'auto',
        maxWidth: 'calc(100% - 20px)'
      }}>
      <Table className={classes.table} size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell colSpan={1} />
            <TableCell colSpan={3} align="center">
              {formatMessage({ id: 'Number of contributors' })}
            </TableCell>
            <TableCell colSpan={4} align="center">
              {formatMessage({ id: 'Latest date of refresh' })}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Subtitle */}
          <TableRow>
            <TableCell />
            <StyledCell align="center">0</StyledCell>
            <StyledCell align="center">1</StyledCell>
            <StyledCell align="center">2+</StyledCell>
            <StyledCell align="center">
              {formatMessage({ id: 'more than 10 years' })}
            </StyledCell>
            <StyledCell align="center">
              {formatMessage({ id: 'between 5 and 10 years' })}
            </StyledCell>
            <StyledCell align="center">
              {formatMessage({ id: 'between 2 and 5 years' })}
            </StyledCell>
            <StyledCell align="center">
              {formatMessage({ id: 'less than 2 years' })}
            </StyledCell>
          </TableRow>

          {/* Body */}
          {rows.map(row => (
            <TableRow key={row.name} style={{ width: '10px' }}>
              <StyledCell>{formatMessage({ id: row.name })}</StyledCell>
              <StyledCell align="center">{row.absent}</StyledCell>
              <StyledCell align="center">{row.one}</StyledCell>
              <StyledCell align="center">{row.twoAndMore}</StyledCell>
              <StyledCell align="center">{row.moreThan10}</StyledCell>
              <StyledCell align="center">{row.between5and10}</StyledCell>
              <StyledCell align="center">{row.between2and5}</StyledCell>
              <StyledCell align="center">{row.lessThan2}</StyledCell>
            </TableRow>
          ))}
        </TableBody>

        {/* Total values */}
        <TableFooter
          style={{
            backgroundColor: theme.palette.primary.veryLight
          }}>
          <TableRow>
            <StyledCellBold>
              {formatMessage({ id: 'Total' })} / 100
            </StyledCellBold>
            <StyledCellBold align="center">{total.absent}</StyledCellBold>
            <StyledCellBold align="center">{total.one}</StyledCellBold>
            <StyledCellBold align="center">{total.twoAndMore}</StyledCellBold>
            <StyledCellBold align="center">{total.moreThan10}</StyledCellBold>
            <StyledCellBold align="center">
              {total.between5and10}
            </StyledCellBold>
            <StyledCellBold align="center">{total.between2and5}</StyledCellBold>
            <StyledCellBold align="center">{total.lessThan2}</StyledCellBold>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

export default DataQualityComputeTable;
