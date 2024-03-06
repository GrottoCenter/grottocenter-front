import React from 'react';
import { Checkbox, IconButton, TableCell, TableRow } from '@mui/material';
import { includes, isNil } from 'ramda';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import CustomCell from './CustomCell';

const StyledTableRow = styled(TableRow)`
  ${({ onClick, theme }) => `
    &:hover {
      background: ${theme.palette.secondary.veryLight};
      cursor: ${onClick && 'pointer'};
    }
  `}
`;

const Row = ({
  row,
  onOpenDetailedView,
  onSelection,
  checked,
  hiddenColumns,
  customCellRenders,
  columns,
  onClick
}) => {
  const handleOpenDetailedView = id => () => {
    if (!isNil(onOpenDetailedView)) {
      onOpenDetailedView(id);
    }
  };

  // Use the columns order to match the table headers order
  const columnIds = columns.map(c => c.id);

  return (
    <StyledTableRow onClick={onClick} hover={!isNil(onSelection)}>
      {!isNil(onSelection) && (
        <TableCell padding="checkbox">
          <Checkbox
            onClick={onSelection}
            checked={checked}
            inputProps={{ 'aria-labelledby': row.id }}
          />
        </TableCell>
      )}
      {!isNil(onOpenDetailedView) && (
        <TableCell padding="checkbox">
          <IconButton
            aria-label="detailed view"
            onClick={handleOpenDetailedView(row.id)}
            size="small">
            <ZoomInIcon />
          </IconButton>
        </TableCell>
      )}
      {columnIds.map(
        keyCell =>
          !includes(keyCell, hiddenColumns) && (
            <CustomCell
              key={keyCell}
              value={row[keyCell]}
              id={keyCell}
              customRenders={
                !isNil(customCellRenders) ? customCellRenders : undefined
              }
            />
          )
      )}
    </StyledTableRow>
  );
};

Row.propTypes = {
  row: PropTypes.shape({
    id: PropTypes.oneOfType([
      PropTypes.string.isRequired,
      PropTypes.number.isRequired
    ])
  }),
  checked: PropTypes.bool.isRequired,
  onOpenDetailedView: PropTypes.func,
  onSelection: PropTypes.func,
  hiddenColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
  customCellRenders: PropTypes.func,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired
      ]),
      label: PropTypes.string
    })
  ).isRequired,
  onClick: PropTypes.func
};

export default Row;
