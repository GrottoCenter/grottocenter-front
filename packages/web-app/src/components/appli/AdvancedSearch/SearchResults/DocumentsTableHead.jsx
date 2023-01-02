import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useIntl } from 'react-intl';

const DocumentsTableHead = () => {
  const { formatMessage } = useIntl();

  return (
    <TableHead>
      <TableRow>
        <TableCell>{formatMessage({ id: 'Title' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Published in' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Subjects' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Country or region' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Authors' })}</TableCell>
        <TableCell>
          {/* Considering the number of columns, "Publication Date" is a bit long */}
          {formatMessage({ id: 'Date' })}
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default DocumentsTableHead;
