import { TableCell, TableRow, TableHead } from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import React from 'react';

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

export const LoadingTableHead = () => (
  <TableHead>
    <TableRow>
      <LoadingTableRow />
    </TableRow>
  </TableHead>
);

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
