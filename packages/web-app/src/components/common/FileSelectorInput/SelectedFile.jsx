import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import AppLink from '../AppLink';
import { getFileIcon } from '../DocumentsList/utils/fileIcons';

const SelectedFile = ({
  file,
  onRemove,
  disabled = false,
  renderFileDetails
}) => {
  const { formatMessage } = useIntl();
  const [preview, setPreview] = useState(null);
  const localFile = file.file;
  const remoteUrl = file.completePath;

  useEffect(() => {
    if (remoteUrl || !(localFile instanceof File)) return undefined;
    const url = URL.createObjectURL(localFile);
    setPreview({ file: localFile, url });
    return () => URL.revokeObjectURL(url);
  }, [localFile, remoteUrl]);

  const localUrl = preview?.file === localFile ? preview?.url : null;
  const url = remoteUrl || localUrl;

  return (
    <Box
      component="li"
      data-testid={`selected-file-${file.fileName}`}
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        overflow: 'hidden'
      }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1
        }}>
        <Typography
          component="div"
          variant="body2"
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            minWidth: 0,
            flex: 1,
            m: 0,
            fontWeight: 600
          }}>
          <Box
            component="span"
            data-testid="file-type-icon"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '1lh',
              flexShrink: 0,
              '& svg': { fontSize: 18 }
            }}>
            {getFileIcon(file.fileName)}
          </Box>
          <Box
            component="span"
            data-testid="selected-file-name"
            sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            {file.fileName}
          </Box>
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {url && (
            <Tooltip title={formatMessage({ id: 'fileSelector.open' })}>
              <Button
                component={AppLink}
                nativeButton={false}
                href={url}
                variant="text"
                size="small"
                aria-label={`${formatMessage({ id: 'fileSelector.open' })} ${file.fileName}`}
                data-testid="open-selected-file"
                sx={{
                  minWidth: 32,
                  height: 32,
                  p: 0.5
                }}>
                <OpenInNewIcon sx={{ fontSize: 18 }} />
              </Button>
            </Tooltip>
          )}
          {onRemove && (
            <Tooltip title={formatMessage({ id: 'Remove' })}>
              <Box component="span" sx={{ display: 'flex' }}>
                <Button
                  type="button"
                  variant="outlined"
                  color="error"
                  size="small"
                  aria-label={`${formatMessage({ id: 'Remove' })} ${file.fileName}`}
                  data-testid="remove-selected-file"
                  disabled={disabled}
                  onClick={() => onRemove(file.fileName)}
                  sx={{ minWidth: 32, height: 32, p: 0.5 }}>
                  <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                </Button>
              </Box>
            </Tooltip>
          )}
        </Box>
      </Box>
      {renderFileDetails?.(file, url)}
    </Box>
  );
};

SelectedFile.propTypes = {
  file: PropTypes.shape({
    fileName: PropTypes.string.isRequired,
    completePath: PropTypes.string,
    file: PropTypes.instanceOf(File)
  }).isRequired,
  onRemove: PropTypes.func,
  disabled: PropTypes.bool,
  renderFileDetails: PropTypes.func
};

export default SelectedFile;
