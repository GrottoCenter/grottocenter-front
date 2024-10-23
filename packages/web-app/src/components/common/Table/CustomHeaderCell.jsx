import { includes, isNil, values } from 'ramda';
import { Checkbox, TableCell, TableSortLabel } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';

export const ActionColumnIds = {
  selection: 'selection',
  detailedView: 'detailedView'
};

export const CustomHeaderCell = ({
  id,
  value,
  customRenders,
  onSort,
  orderBy,
  order,
  isChecked,
  onSelection
}) => {
  const customRender =
    !isNil(customRenders) && !isNil(customRenders(id))
      ? customRenders(id)
      : undefined;
  const displayedValue = !isNil(customRender)
    ? customRender(value)
    : value || '';

  let padding;
  if (id === 'selection') padding = 'checkbox';

  return (
    <TableCell key={id} align="right" padding={padding}>
      {id === 'selection' && !!onSelection && (
        <Checkbox
          color="default"
          onClick={onSelection}
          checked={isChecked}
          inputProps={{ 'aria-label': id }}
        />
      )}
      {!isNil(onSort) && !includes(id, values(ActionColumnIds)) ? (
        <TableSortLabel
          active={orderBy === id}
          direction={orderBy === id ? order : 'asc'}
          onClick={onSort(id)}>
          {displayedValue}
        </TableSortLabel>
      ) : (
        displayedValue
      )}
    </TableCell>
  );
};

CustomHeaderCell.propTypes = {
  id: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired
  ]),
  value: PropTypes.oneOfType([
    PropTypes.string.isRequired,
    PropTypes.number.isRequired,
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired
      ])
    ),
    // eslint-disable-next-line react/forbid-prop-types
    PropTypes.any
  ]),
  customRenders: PropTypes.func,
  onSort: PropTypes.func,
  orderBy: PropTypes.string,
  order: PropTypes.oneOf(['asc', 'desc']),
  isChecked: PropTypes.bool,
  onSelection: PropTypes.func
};

export default CustomHeaderCell;
