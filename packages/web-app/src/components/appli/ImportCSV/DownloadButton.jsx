import React from 'react';
import { CSVDownloader } from 'react-papaparse';
import PropTypes from 'prop-types';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { IconButton, Tooltip } from '@mui/material';
import { useIntl } from 'react-intl';

const DownloadButton = ({ data, filename }) => {
  const { formatMessage } = useIntl();
  return (
    <CSVDownloader
      data={data}
      type="button"
      filename={filename}
      style={{
        backgroundColor: 'transparent',
        backgroundRepeat: 'no-repeat',
        border: 'none',
        cursor: 'pointer',
        overflow: 'hidden',
        outline: 'none'
      }}>
      <Tooltip title={formatMessage({ id: 'Download information' })}>
        <IconButton color="primary" size="small">
          <CloudDownloadIcon />
        </IconButton>
      </Tooltip>
    </CSVDownloader>
  );
};

DownloadButton.propTypes = {
  data: PropTypes.arrayOf(PropTypes.objectOf(PropTypes.string)).isRequired,
  filename: PropTypes.string.isRequired
};

export default DownloadButton;
