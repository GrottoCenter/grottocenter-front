import { TableCell, TableRow } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import React from 'react';

const ROW_COUNT = 8;

const InitialTable = () => (
  <>
    {Array(ROW_COUNT)
      .fill(null)
      .map((__, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <TableRow key={i}>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
          <TableCell>
            <Skeleton />
          </TableCell>
        </TableRow>
      ))}
  </>
);

export const InitialHead = () => (
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

export default InitialTable;
