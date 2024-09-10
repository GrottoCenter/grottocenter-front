import React from 'react';
import PropTypes from 'prop-types';
import {
  Tooltip,
  FormControl,
  Input,
  ListItemText,
  Select,
  Checkbox,
  MenuItem
} from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useIntl } from 'react-intl';

import idNameType from '../../../types/idName.type';
import { PropertyWrapper } from '../../common/Properties/Property';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

const EntrancesSelector = ({
  isLoading = false,
  entrances,
  onSelect,
  selectedEntrancesId
}) => {
  const { formatMessage } = useIntl();

  const handleChange = event => {
    onSelect(event.target.value);
  };

  return (
    <PropertyWrapper>
      <VisibilityIcon fontSize="large" color="primary" />
      <Tooltip title={formatMessage({ id: 'Network entrances' })}>
        {isLoading ? (
          <Skeleton variant="text" width="100%" />
        ) : (
          <FormControl fullWidth>
            <Select
              displayEmpty
              multiple
              value={selectedEntrancesId}
              onChange={handleChange}
              input={<Input />}
              renderValue={selected => {
                if (selected.length === 0) {
                  return <em>{formatMessage({ id: 'Network entrances' })}</em>;
                }

                return entrances
                  .filter(e => selected.includes(e.id))
                  .map(e => e.name)
                  .join(', ');
              }}
              MenuProps={MenuProps}>
              <MenuItem disabled value="">
                <em>{formatMessage({ id: 'Network entrances' })}</em>
              </MenuItem>
              {entrances.map(({ name, id }) => (
                <MenuItem key={name} value={id}>
                  <Checkbox checked={selectedEntrancesId.includes(id)} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Tooltip>
    </PropertyWrapper>
  );
};

EntrancesSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  entrances: PropTypes.arrayOf(idNameType),
  selectedEntrancesId: PropTypes.arrayOf(PropTypes.number)
};

export default EntrancesSelector;
