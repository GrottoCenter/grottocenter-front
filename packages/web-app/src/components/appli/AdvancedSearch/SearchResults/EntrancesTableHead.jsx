import React from 'react';
import { TableCell, TableHead, TableRow } from '@material-ui/core';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

const HeaderIcon = styled.img`
  height: 3.6rem;
  vertical-align: middle;
  width: 3.6rem;
`;

const EntrancesTableHead = () => {
  const { formatMessage } = useIntl();

  return (
    <TableHead>
      <TableRow>
        <TableCell color="inherit">{formatMessage({ id: 'Name' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Country' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Massif name' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Aesthetic' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Ease of move' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Ease of reach' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Network name' })}</TableCell>
        <TableCell>
          <HeaderIcon
            src="/images/length.svg"
            title={formatMessage({
              id: 'Cave length',
              defaultMessage: 'Cave length'
            })}
            alt="Cave length icon"
          />
        </TableCell>
        <TableCell>
          <HeaderIcon
            src="/images/depth.svg"
            title={formatMessage({
              id: 'Cave depth',
              defaultMessage: 'Cave depth'
            })}
            alt="Cave depth icon"
          />
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default EntrancesTableHead;
