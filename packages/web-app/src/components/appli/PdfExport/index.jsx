import { useEffect, useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useQueries } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import StandardDialog from '@/components/common/StandardDialog';
import DocumentTypeChip from '@/components/common/DocumentTypeChip';
import { downloadBlob } from '@/components/common/DocumentsList/utils/imageUtils';
import { usePdfExport } from '@/hooks/usePdfExport';
import { documentQueryOptions } from '@/api/documentQueryOptions';
import { PDF_ADAPTERS } from '@/pdf/adapters';
import { buildDocumentIndex, getPdfAttachments } from '@/pdf/shared/model';

const PdfExport = ({
  entity,
  entityType,
  statistics = null,
  isAdmin,
  open,
  onClose
}) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const appendicesHelpId = useId();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();
  const adapter = PDF_ADAPTERS[entityType];
  const [sections, setSections] = useState(() =>
    Object.fromEntries(
      Object.entries(adapter.availability(entity, isAdmin, { statistics })).map(
        ([key, available]) => [key, available]
      )
    )
  );
  const [selectedDocuments, setSelectedDocuments] = useState({});
  const [excludedDocuments, setExcludedDocuments] = useState({});
  const [format, setFormat] = useState('a4');
  const { generate, cancel, isGenerating, error, progress } = usePdfExport();
  const listedDocuments = useMemo(
    () => (entity.documents ?? []).filter(document => !document.isDeleted),
    [entity.documents]
  );
  const queries = useQueries({
    queries: listedDocuments.map(document => ({
      ...documentQueryOptions(document.id),
      enabled: open
    }))
  });
  const documents = queries
    .map((query, index) => query.data ?? listedDocuments[index])
    .filter(document => !excludedDocuments[document.id]);
  const activeQueries = queries.filter(
    (_query, index) => !excludedDocuments[listedDocuments[index].id]
  );
  const failedDocuments = queries.flatMap((query, index) =>
    query.isError && !excludedDocuments[listedDocuments[index].id]
      ? [{ document: listedDocuments[index], query }]
      : []
  );
  const attachments = getPdfAttachments(documents);
  const availability = adapter.availability(entity, isAdmin, {
    statistics
  });
  const documentGroups = buildDocumentIndex({
    documents,
    attachments,
    includeReferences: true,
    intl
  }).references.filter(document => document.files.length);
  const files = attachments
    .filter(file => selectedDocuments[file.documentId])
    .map(file => ({ ...file, pages: '' }));
  const isDocumentsLoading = activeQueries.some(query => query.isPending);
  const hasDocumentErrors = activeQueries.some(query => query.isError);
  const needsDocuments = sections.documents || files.length > 0;
  const isEmpty =
    !adapter.sections.some(
      section => sections[section.key] && availability[section.key]
    ) && files.length === 0;
  const requiredQueries = sections.documents
    ? activeQueries
    : queries.filter(
        (_query, index) =>
          selectedDocuments[listedDocuments[index].id] &&
          !excludedDocuments[listedDocuments[index].id]
      );
  const isBlocked =
    isEmpty ||
    (needsDocuments &&
      requiredQueries.some(query => query.isPending || query.isError));

  const documentRevision = requiredQueries
    .map(query => query.dataUpdatedAt)
    .join(':');
  const unavailableDocumentIds = new Set(
    listedDocuments
      .filter(
        (_document, index) => queries[index].isPending || queries[index].isError
      )
      .map(document => document.id)
  );
  useEffect(() => {
    cancel();
  }, [entity, isAdmin, intl.locale, open, documentRevision, cancel]);

  const updateSections = (key, checked) => {
    cancel();
    setSections(previous => ({ ...previous, [key]: checked }));
  };
  const updateDocument = (id, checked) => {
    cancel();
    setSelectedDocuments(previous => ({ ...previous, [id]: checked }));
  };
  const handleClose = () => {
    cancel();
    onClose();
  };
  const handleGenerate = async () => {
    const model = adapter.build({
      entity,
      statistics,
      isAdmin,
      sections,
      documents,
      attachments: files,
      intl
    });
    const blob = await generate({ model, files, format, mapZoom: 14 });
    if (!blob) return;
    const name =
      [...(entity.name ?? '')]
        .filter(character => character.charCodeAt(0) >= 32)
        .join('')
        .replace(/[<>:"/\\|?*]/g, '-')
        .trim() || `${entityType}-${entity.id}`;
    downloadBlob(blob, `${name}.pdf`);
    handleClose();
    enqueueSnackbar(formatMessage({ id: 'pdf.downloadStarted' }), {
      variant: 'success'
    });
  };

  return (
    <StandardDialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
      scrollable
      dividers
      showCloseButton={false}
      stackActionsOnMobile
      title={[formatMessage({ id: 'pdf.download' }), entity.name]
        .filter(Boolean)
        .join(' · ')}
      actions={
        <>
          <Button variant="outlined" onClick={handleClose}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            variant="contained"
            startIcon={
              isGenerating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <DownloadIcon />
              )
            }
            disabled={isBlocked || isGenerating}
            onClick={handleGenerate}
            data-testid="entrance-pdf-download">
            {formatMessage({ id: 'pdf.download' })}
          </Button>
        </>
      }>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 1.5,
          '& .MuiFormControlLabel-root': {
            m: 0,
            alignItems: 'flex-start',
            minHeight: 32
          },
          '& .MuiCheckbox-root': { p: 0.5 },
          '& .MuiFormControlLabel-label': {
            typography: 'body2',
            py: 0.25
          }
        }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">
            {formatMessage({ id: 'pdf.mainContent' })}
          </FormLabel>
          <FormGroup
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))'
              },
              columnGap: 1
            }}>
            {adapter.sections
              .filter(section => availability[section.key])
              .map(section => (
                <FormControlLabel
                  key={section.key}
                  label={formatMessage({ id: section.label })}
                  control={
                    <Checkbox
                      size="small"
                      checked={Boolean(
                        sections[section.key] && availability[section.key]
                      )}
                      disabled={isGenerating || !availability[section.key]}
                      onChange={event =>
                        updateSections(section.key, event.target.checked)
                      }
                    />
                  }
                />
              ))}
          </FormGroup>
        </FormControl>
        <FormControl component="fieldset" aria-describedby={appendicesHelpId}>
          <FormLabel component="legend">
            {formatMessage({ id: 'pdf.appendices' })}
          </FormLabel>
          <Typography
            id={appendicesHelpId}
            variant="caption"
            color="text.secondary"
            sx={{ mb: 0.5 }}>
            {formatMessage({ id: 'pdf.appendicesHelp' })}
          </Typography>
          {isDocumentsLoading && (
            <CircularProgress
              size={24}
              aria-label={formatMessage({ id: 'Loading ...' })}
            />
          )}
          {failedDocuments.map(({ document, query }) => (
            <Alert key={document.id} severity="error" sx={{ mb: 1 }}>
              {formatMessage(
                { id: 'pdf.exportError' },
                {
                  resource: document.title || formatMessage({ id: 'Documents' })
                }
              )}
              <Button disabled={isGenerating} onClick={() => query.refetch()}>
                {formatMessage({ id: 'Retry' })}
              </Button>
              <Button
                disabled={isGenerating}
                onClick={() => {
                  cancel();
                  setExcludedDocuments(previous => ({
                    ...previous,
                    [document.id]: true
                  }));
                  setSelectedDocuments(previous => ({
                    ...previous,
                    [document.id]: false
                  }));
                }}>
                {formatMessage({ id: 'pdf.excludeDocument' })}
              </Button>
            </Alert>
          ))}
          {!isDocumentsLoading &&
            !hasDocumentErrors &&
            attachments.length === 0 && (
              <Typography variant="body2">
                {formatMessage({ id: 'No files attached to this document.' })}
              </Typography>
            )}
          {documentGroups.map(document => (
            <Box key={document.id} data-testid={`pdf-document-${document.id}`}>
              <FormControlLabel
                label={
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 0.5
                    }}>
                    <Typography variant="body2">{document.title}</Typography>
                    <DocumentTypeChip type={document.type} />
                  </Box>
                }
                control={
                  <Checkbox
                    size="small"
                    disabled={
                      isGenerating || unavailableDocumentIds.has(document.id)
                    }
                    checked={Boolean(selectedDocuments[document.id])}
                    onChange={event =>
                      updateDocument(document.id, event.target.checked)
                    }
                  />
                }
              />
            </Box>
          ))}
          {files.some(file => file.isPdf) && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                mt: 1
              }}>
              <Typography variant="body2">
                {formatMessage({ id: 'pdf.pageFormat' })}
              </Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                disabled={isGenerating}
                aria-label={formatMessage({ id: 'pdf.pageFormat' })}
                value={format}
                onChange={(_event, value) => {
                  if (!value) return;
                  cancel();
                  setFormat(value);
                }}
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    px: 1.5,
                    minHeight: { xs: 44, sm: 36 }
                  }
                }}>
                <Tooltip
                  title={formatMessage({ id: 'pdf.fitA4' })}
                  describeChild>
                  <ToggleButton value="a4">A4</ToggleButton>
                </Tooltip>
                <Tooltip
                  title={formatMessage({ id: 'pdf.originalSize' })}
                  describeChild>
                  <ToggleButton value="original">
                    {formatMessage({ id: 'pdf.originalSizeShort' })}
                  </ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>
            </Box>
          )}
        </FormControl>
      </Box>
      {isGenerating && (
        <Box
          role="status"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="body2">
            {formatMessage({ id: 'Processing, this may take some time...' })}{' '}
            {progress}
          </Typography>
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.resource
            ? formatMessage({ id: error.id }, { resource: error.resource })
            : formatMessage({ id: 'An unexpected error occurred' })}
        </Alert>
      )}
      {isEmpty && !isGenerating && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {formatMessage({ id: 'pdf.selectContent' })}
        </Alert>
      )}
    </StandardDialog>
  );
};

PdfExport.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    cave: PropTypes.shape({ id: PropTypes.number }),
    documents: PropTypes.arrayOf(
      PropTypes.shape({ id: PropTypes.number.isRequired })
    )
  }).isRequired,
  entityType: PropTypes.oneOf(['entrance', 'network', 'massif']).isRequired,
  statistics: PropTypes.shape({ nb_caves: PropTypes.number }),
  isAdmin: PropTypes.bool.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default PdfExport;
