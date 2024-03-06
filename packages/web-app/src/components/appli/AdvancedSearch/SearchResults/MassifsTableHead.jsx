import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';

const HeaderIcon = styled('img')`
  height: 3.6rem;
  vertical-align: middle;
  width: 3.6rem;
`;

const MassifsTableHead = () => {
  const { formatMessage } = useIntl();

  return (
    <TableHead>
      <TableRow>
        <TableCell>{formatMessage({ id: 'Name' })}</TableCell>
        <TableCell>
          <HeaderIcon
            src="/images/entry-cluster.svg"
            title={formatMessage({
              id: 'Number of caves',
              defaultMessage: 'Number of caves'
            })}
            alt="Cave icon"
          />
        </TableCell>
        <TableCell>
          <HeaderIcon
            src="/images/gc-entries.svg"
            title={formatMessage({
              id: 'Number of entrances',
              defaultMessage: 'Number of entrances'
            })}
            alt="Entrances icon"
          />
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default MassifsTableHead;
