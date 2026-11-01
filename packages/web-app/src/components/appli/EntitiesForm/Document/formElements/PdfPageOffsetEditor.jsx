import { useCallback, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Stack,
  Tooltip,
  Typography
} from '@mui/material';
import ArrowForward from '@mui/icons-material/ArrowForward';
import ExpandMore from '@mui/icons-material/ExpandMore';
import OpenInNew from '@mui/icons-material/OpenInNew';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import AppLink from '@/components/common/AppLink';
import NumberField from '@/components/appli/EntitiesForm/utils/NumberField';
import { getPdfPageOffset, withPdfPage } from '@/utils/pdfUrl';

// Only the offset is persisted. Reconstruct a valid example when editing it.
const getExample = offset =>
  Number.isInteger(offset)
    ? {
        printedPage: Math.max(1, 1 - offset),
        pdfPage: Math.max(1, 1 + offset)
      }
    : { printedPage: '', pdfPage: '' };

const PdfPageOffsetEditor = ({ value = null, onChange, src }) => {
  const { formatMessage } = useIntl();
  const contentId = useId();
  const helpId = useId();
  const toggleRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [helpAnchor, setHelpAnchor] = useState(null);
  const emittedOffsetRef = useRef(value);
  const { control, reset, getValues, getFieldState, trigger } = useForm({
    defaultValues: getExample(value),
    mode: 'onTouched',
    reValidateMode: 'onChange'
  });
  const [printedPage, pdfPage] = useWatch({
    control,
    name: ['printedPage', 'pdfPage']
  });
  const offset = getPdfPageOffset(printedPage, pdfPage);
  const renderPdfLink = useCallback(
    chunks => (src ? <AppLink href={src}>{chunks}</AppLink> : chunks),
    [src]
  );

  useEffect(() => {
    if (!isExpanded) return;
    if (!Object.is(emittedOffsetRef.current, offset)) {
      emittedOffsetRef.current = offset;
      onChange(offset);
    }
    ['printedPage', 'pdfPage'].forEach(name => {
      if (getFieldState(name).isTouched) trigger(name);
    });
  }, [
    offset,
    printedPage,
    pdfPage,
    isExpanded,
    onChange,
    getFieldState,
    trigger
  ]);

  const handleOpen = () => {
    emittedOffsetRef.current = value;
    reset(getExample(value));
    setIsExpanded(true);
  };
  const handleClose = async () => {
    if (!(await trigger(undefined, { shouldFocus: true }))) return;
    setIsExpanded(false);
    toggleRef.current?.focus();
  };
  const handleRemove = () => {
    onChange(null);
    emittedOffsetRef.current = null;
    reset(getExample(null));
    setIsExpanded(false);
    toggleRef.current?.focus();
  };
  const requiredPage = other => ({
    validate: current =>
      current !== '' ||
      getValues(other) === '' ||
      formatMessage({ id: 'pdfPagination.required' })
  });
  const canTest = src && Number.isInteger(offset);

  return (
    <Box
      sx={{ textAlign: 'start', borderTop: 1, borderColor: 'divider' }}
      data-testid="pdf-page-offset">
      <Box sx={{ display: 'flex', px: 1.5 }}>
        <Button
          ref={toggleRef}
          variant="text"
          sx={{ textTransform: 'none', minHeight: 32, py: 0.25 }}
          size="small"
          type="button"
          aria-expanded={isExpanded}
          data-testid="pdf-pagination-toggle"
          aria-controls={isExpanded ? contentId : undefined}
          onClick={isExpanded ? handleClose : handleOpen}
          startIcon={
            <ExpandMore
              sx={{ transform: isExpanded ? 'rotate(180deg)' : undefined }}
            />
          }>
          {formatMessage({
            id: Number.isInteger(value)
              ? 'pdfPagination.adjusted'
              : 'pdfPagination.adjust'
          })}
        </Button>
      </Box>
      {isExpanded && (
        <Box
          id={contentId}
          sx={{
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'grey.50',
            borderTop: 1,
            borderColor: 'divider'
          }}>
          <Box sx={{ maxWidth: theme => theme.spacing(82) }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ mb: 2, alignItems: 'center' }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ flex: 1 }}>
                {formatMessage(
                  { id: 'pdfPagination.instructions' },
                  { pdf: renderPdfLink }
                )}
              </Typography>
              <Tooltip title={formatMessage({ id: 'Information' })}>
                <IconButton
                  type="button"
                  size="small"
                  aria-label={formatMessage({ id: 'Information' })}
                  data-testid="pdf-pagination-help"
                  aria-expanded={Boolean(helpAnchor)}
                  aria-controls={helpAnchor ? helpId : undefined}
                  onClick={event => setHelpAnchor(event.currentTarget)}
                  sx={{ color: 'text.secondary' }}>
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
            <Popover
              id={helpId}
              open={Boolean(helpAnchor)}
              anchorEl={helpAnchor}
              onClose={() => setHelpAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                paper: { sx: { maxWidth: theme => theme.spacing(48), p: 1.5 } }
              }}>
              <Typography variant="body2">
                {formatMessage({ id: 'pdfPagination.help' })}
              </Typography>
            </Popover>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ alignItems: { xs: 'stretch', sm: 'flex-start' } }}>
              <NumberField
                name="printedPage"
                control={control}
                label="pdfPagination.printedPage"
                size="small"
                variant="outlined"
                min={1}
                max={2147483647}
                rules={requiredPage('pdfPage')}
                sx={{ flex: '1 1 0', minWidth: 0 }}
              />
              <ArrowForward
                aria-hidden="true"
                sx={{ display: { xs: 'none', sm: 'block' }, mt: 1 }}
              />
              <NumberField
                name="pdfPage"
                control={control}
                label="pdfPagination.pdfPage"
                size="small"
                variant="outlined"
                min={1}
                max={2147483647}
                rules={requiredPage('printedPage')}
                sx={{ flex: '1 1 0', minWidth: 0 }}
              />
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              data-testid="pdf-pagination-actions"
              sx={{
                mt: 2,
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexWrap: 'wrap'
              }}>
              {canTest && (
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ textTransform: 'none' }}
                  component={AppLink}
                  nativeButton={false}
                  href={withPdfPage(src, Number(pdfPage))}
                  size="small"
                  endIcon={<OpenInNew />}>
                  {formatMessage({ id: 'pdfPagination.test' })}
                </Button>
              )}
              {(printedPage !== '' || pdfPage !== '') && (
                <Button
                  variant="outlined"
                  color="error"
                  sx={{ textTransform: 'none' }}
                  size="small"
                  type="button"
                  onClick={handleRemove}>
                  {formatMessage({ id: 'Clear' })}
                </Button>
              )}
              <Button
                variant="contained"
                size="small"
                type="button"
                onClick={handleClose}
                sx={{ textTransform: 'none' }}>
                {formatMessage({ id: 'OK' })}
              </Button>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

PdfPageOffsetEditor.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  src: PropTypes.string
};

export default PdfPageOffsetEditor;
