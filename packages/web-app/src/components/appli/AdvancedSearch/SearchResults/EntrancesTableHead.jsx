import React from 'react';
import PropTypes from 'prop-types';
import { TableCell, TableHead, TableRow } from '@mui/material';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';

const HeaderIcon = styled('img')`
  height: 3.6rem;
  vertical-align: middle;
  width: 3.6rem;
`;

const EntrancesTableHead = ({ showCheckbox, onSelectAll, allSelected }) => {
  const { formatMessage } = useIntl();

  return (
    <TableHead>
      <TableRow>
        {showCheckbox && (
          <TableCell padding="checkbox">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
            />
          </TableCell>
        )}
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

EntrancesTableHead.propTypes = {
  showCheckbox: PropTypes.bool,
  onSelectAll: PropTypes.func,
  allSelected: PropTypes.bool
};

export default EntrancesTableHead;
