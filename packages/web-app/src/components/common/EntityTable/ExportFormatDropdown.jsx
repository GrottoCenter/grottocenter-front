import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Menu, MenuItem } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { EXPORT_FORMATS } from '../../../conf/exportFormats';
import ToolbarActionButton from './ToolbarActionButton';

const ExportFormatDropdown = ({ disabled, onExport, iconOnly = false }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const exportLabel = formatMessage({ id: 'Export' });
  // A tooltip only where it adds something: the reason the button is dead, or
  // the name of an icon that carries no text.
  let tooltip = null;
  if (disabled) {
    tooltip = formatMessage({ id: 'Export unavailable above 10000 results' });
  } else if (iconOnly) {
    tooltip = exportLabel;
  }

  const handleSelect = value => {
    setAnchorEl(null);
    onExport(value);
  };

  return (
    <>
      <ToolbarActionButton
        icon={FileDownloadIcon}
        label={iconOnly ? null : exportLabel}
        tooltip={tooltip}
        endIcon={iconOnly ? null : <ArrowDropDownIcon />}
        disabled={disabled}
        onClick={event => setAnchorEl(event.currentTarget)}
      />
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}>
        {EXPORT_FORMATS.map(({ value, label }) => (
          <MenuItem key={value} onClick={() => handleSelect(value)}>
            {label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

ExportFormatDropdown.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onExport: PropTypes.func.isRequired,
  iconOnly: PropTypes.bool
};

export default ExportFormatDropdown;
