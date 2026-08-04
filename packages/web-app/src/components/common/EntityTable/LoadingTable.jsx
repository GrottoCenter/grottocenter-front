import { TableCell, TableRow, TableHead } from '@mui/material';
import PropTypes from 'prop-types';
import Skeleton from '@mui/material/Skeleton';

export const LoadingTableRow = () => (
  <>
    <TableCell>
      <Skeleton />
    </TableCell>
    <TableCell>
      <Skeleton />
    </TableCell>
    <TableCell>
      <Skeleton />
    </TableCell>
  </>
);

export const LoadingTableHead = ({ stickyTop = 0 }) => (
  <TableHead>
    <TableRow>
      <TableCell sx={{ top: stickyTop }}>
        <Skeleton />
      </TableCell>
      <TableCell sx={{ top: stickyTop }}>
        <Skeleton />
      </TableCell>
      <TableCell sx={{ top: stickyTop }}>
        <Skeleton />
      </TableCell>
    </TableRow>
  </TableHead>
);
LoadingTableHead.propTypes = {
  stickyTop: PropTypes.number
};

export const LoadingTableBodyInner = () => (
  <>
    {Array(8)
      .fill(null)
      .map((__, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TableRow key={i}>
          <LoadingTableRow />
        </TableRow>
      ))}
  </>
);
