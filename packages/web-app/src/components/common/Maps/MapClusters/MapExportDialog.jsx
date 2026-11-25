import { useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import StandardDialog from '@/components/common/StandardDialog';
import { downloadBlob } from '@/components/common/DocumentsList/utils/imageUtils';
import { useNotification, useOnlineStatus } from '@/hooks';
import { fetchAdvancedSearchExport } from '@/actions/Advancedsearch';
import { EXPORT_FORMATS } from '@/conf/exportFormats';
import {
  makeMapExportSearch,
  getMapExportBounds,
  MAX_MAP_EXPORT_ROWS,
  prepareMapExportBlob
} from '@/utils/mapEntranceExport';

const FORMATS = ['gpx', 'kml', 'geojson'].map(value =>
  EXPORT_FORMATS.find(format => format.value === value)
);
const ERROR_IDS = new Set([
  'mapExport.empty',
  'mapExport.tooMany',
  'mapExport.invalidFile'
]);

// The shared action row sets a desktop min-height on its button descendants.
// Keep this export usable on touch devices in landscape as well as portrait.
const ACTION_BUTTON_SX = { '&&': { minHeight: 44 } };

const getErrorId = error => {
  if (ERROR_IDS.has(error?.code)) return error.code;
  const message =
    error?.body?.error ?? error?.body?.message ?? error?.body ?? error?.message;
  if (
    error?.status === 400 &&
    /cannot contain more than 10000 results/i.test(String(message))
  )
    return 'mapExport.tooMany';
  if (error?.status === 429) return 'Too many requests';
  return 'mapExport.error';
};

const MapExportDialog = ({ selection, onClose }) => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();
  const isOnline = useOnlineStatus();
  const [format, setFormat] = useState('gpx');
  const download = useRef(null);
  const titleId = useId();
  const scopeId = useId();
  const formatId = useId();
  const mutation = useMutation({
    mutationFn: async ({ controller, selectedFormat }) => {
      const bounds = getMapExportBounds(selection);
      try {
        const blobs = await Promise.all(
          bounds.map(box =>
            fetchAdvancedSearchExport({
              ...makeMapExportSearch(box),
              columns: ['name'],
              format: selectedFormat,
              signal: controller.signal
            })
          )
        );
        return await prepareMapExportBlob(blobs, selectedFormat, bounds);
      } catch (error) {
        // Cancel the other half of an antimeridian export on request failure.
        controller.abort();
        throw error;
      }
    },
    retry: false,
    gcTime: 0,
    meta: { errorPresentation: 'inline' }
  });

  useEffect(() => () => download.current?.abort(), []);
  useEffect(() => {
    if (!isOnline) download.current?.abort();
  }, [isOnline]);

  const handleClose = () => {
    download.current?.abort();
    onClose();
  };

  const handleDownload = async () => {
    if (download.current || !isOnline) return;
    const controller = new AbortController();
    download.current = controller;
    try {
      const blob = await mutation.mutateAsync({
        controller,
        selectedFormat: format
      });
      if (controller.signal.aborted) return;
      downloadBlob(
        blob,
        `Grottocenter_map_export_${new Date().toISOString().replace(/[:.]/g, '-')}.${format}`
      );
      onSuccess(formatMessage({ id: 'mapExport.started' }));
      onClose();
    } catch {
      // The mutation error is presented inline. Cancellation must stay silent.
    } finally {
      if (download.current === controller) download.current = null;
    }
  };

  const error = mutation.error?.name === 'AbortError' ? null : mutation.error;
  const errorId = error ? getErrorId(error) : null;
  const needsSmallerArea = errorId === 'mapExport.tooMany';
  const isEmpty = errorId === 'mapExport.empty';
  let errorSeverity = 'error';
  if (needsSmallerArea) errorSeverity = 'warning';
  if (isEmpty) errorSeverity = 'info';
  const isBlocked = !isOnline || needsSmallerArea || isEmpty;

  return (
    <StandardDialog
      open
      fullScreenOnMobile
      maxWidth="xs"
      disableRestoreFocus
      title={
        <span id={titleId}>{formatMessage({ id: 'mapExport.title' })}</span>
      }
      aria-labelledby={titleId}
      aria-describedby={scopeId}
      slotProps={{ paper: { 'data-testid': 'map-export-dialog' } }}
      onClose={handleClose}
      actions={
        <>
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={ACTION_BUTTON_SX}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            loading={mutation.isPending}
            loadingPosition="start"
            disabled={isBlocked || mutation.isPending}
            onClick={handleDownload}
            sx={ACTION_BUTTON_SX}
            data-testid="map-export-download">
            {formatMessage({ id: 'Download' })}
          </Button>
        </>
      }>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Alert severity="info" role="note" id={scopeId}>
          {formatMessage({ id: 'mapExport.scope' })}
        </Alert>
        {(mutation.isPending || !isOnline || errorId) && (
          <Box aria-live="polite" aria-atomic="true">
            {mutation.isPending && isOnline && (
              <Box role="status">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {formatMessage({ id: 'mapExport.loading' })}
                </Typography>
                <LinearProgress />
              </Box>
            )}
            {!isOnline && (
              <Alert severity="info">
                {formatMessage({ id: 'mapExport.offline' })}
              </Alert>
            )}
            {errorId && isOnline && !mutation.isPending && (
              <Alert severity={errorSeverity}>
                {formatMessage({ id: errorId }, { limit: MAX_MAP_EXPORT_ROWS })}
                {!needsSmallerArea && !isEmpty && (
                  <Button
                    onClick={handleDownload}
                    sx={{ display: 'block', mt: 1, minHeight: 44 }}>
                    {formatMessage({ id: 'mapExport.retry' })}
                  </Button>
                )}
              </Alert>
            )}
          </Box>
        )}
        <FormControl disabled={mutation.isPending}>
          <FormLabel id={formatId}>
            {formatMessage({ id: 'mapExport.format' })}
          </FormLabel>
          <RadioGroup
            aria-labelledby={formatId}
            value={format}
            onChange={event => setFormat(event.target.value)}>
            {FORMATS.map(({ value, label }) => (
              <FormControlLabel
                key={value}
                value={value}
                control={<Radio />}
                sx={{ mx: 0, minHeight: 56, alignItems: 'center' }}
                label={
                  <Box sx={{ py: 0.5 }}>
                    <Typography variant="body1" component="span">
                      {label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {value === 'kml'
                        ? 'Google Earth'
                        : formatMessage({ id: `mapExport.${value}` })}
                    </Typography>
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>
    </StandardDialog>
  );
};

MapExportDialog.propTypes = {
  selection: PropTypes.shape({
    south: PropTypes.number.isRequired,
    west: PropTypes.number.isRequired,
    north: PropTypes.number.isRequired,
    east: PropTypes.number.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default MapExportDialog;
