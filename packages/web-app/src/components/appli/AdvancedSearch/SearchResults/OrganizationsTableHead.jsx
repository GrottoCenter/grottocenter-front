import React from 'react';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

const HeaderIcon = styled.img`
  height: 3.6rem;
  vertical-align: middle;
  width: 3.6rem;
`;

const OrganizationsTableHead = () => {
  const { formatMessage } = useIntl();

  return (
    <TableHead>
      <TableRow>
        <TableCell>{formatMessage({ id: 'Name' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Email' })}</TableCell>
        <TableCell>{formatMessage({ id: 'City' })}</TableCell>
        <TableCell>{formatMessage({ id: 'County' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Region' })}</TableCell>
        <TableCell>{formatMessage({ id: 'Country' })}</TableCell>
        <TableCell>
          <HeaderIcon
            src="/images/caver-cluster.svg"
            title={formatMessage({
              id: 'Number of cavers',
              defaultMessage: 'Number of cavers'
            })}
            alt="Cavers icon"
          />
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

export default OrganizationsTableHead;
