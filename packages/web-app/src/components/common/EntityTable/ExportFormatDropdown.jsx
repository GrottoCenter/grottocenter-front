import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Menu, MenuItem, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import { EXPORT_FORMATS } from '../../../conf/exportFormats';

const ExportFormatDropdown = ({ disabled, onExport }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = value => {
    handleClose();
    onExport(value);
  };

  const button = (
    <Button
      variant="outlined"
      size="small"
      color="primary"
      disabled={disabled}
      onClick={handleClick}
      startIcon={<FileDownloadIcon />}
      endIcon={<ArrowDropDownIcon />}
      sx={{ minWidth: 0 }}>
      <Box
        component="span"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
        {formatMessage({ id: 'Export' })}
      </Box>
    </Button>
  );

  if (disabled) {
    return (
      <Tooltip
        title={formatMessage({
          id: 'Export unavailable above 10000 results'
        })}>
        <span>{button}</span>
      </Tooltip>
    );
  }

  return (
    <>
      {button}
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
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
  onExport: PropTypes.func.isRequired
};

export default ExportFormatDropdown;
