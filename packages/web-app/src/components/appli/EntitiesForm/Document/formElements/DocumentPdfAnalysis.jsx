import { useContext, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import RefreshOutlined from '@mui/icons-material/RefreshOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import StandardDialog from '@/components/common/StandardDialog';
import ResponsiveActionRow from '@/components/common/ResponsiveActionRow';

import { useAnalyzeDocument } from '@/hooks/mutations/useAnalyzeDocument';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { useLanguages } from '@/hooks/queries/useLanguages';
import {
  DOCUMENT_AI_LIMITS,
  DOCUMENT_AI_MAX_FILE_SIZE
} from '@/utils/documentAnalysis';
import { DocumentFormContext } from '../Provider';
import { analysisFileType } from '../types';
import DocumentAiSuggestion, {
  DocumentAiComparisonHeader
} from './DocumentAiSuggestion';

const getErrorMessage = error => {
  if (error.name === 'TimeoutError' || error.status === 504)
    return 'documentAi.timeout';
  if (error.status === 401 || error.status === 403)
    return 'documentAi.authError';
  if ([413, 415, 422].includes(error.status)) return 'documentAi.invalidPdf';
  if (error.status === 429) return 'documentAi.quota';
  if (error.status === 503) return 'documentAi.unavailable';
  return 'documentAi.error';
};

const EMPTY_SELECTION = {
  title: false,
  mainLanguage: false,
  description: false,
  datePublication: false
};

const getFileIdentity = file =>
  file instanceof File ? file : file?.completePath;

const PdfAnalysisRequest = ({ file, disabled }) => {
  const { formatMessage, formatNumber } = useIntl();
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const analysis = useAnalyzeDocument();
  const controller = useRef(null);
  const session = useSelector(state => state.login.authToken);
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const [selectedLanguageId, setSelectedLanguageId] = useState('');
  const { data: languages = [], isPending: areLanguagesPending } =
    useLanguages();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const fileId = useId();
  const descriptionId = useId();
  const fileIdentity = getFileIdentity(file);

  useEffect(() => () => controller.current?.abort(), [fileIdentity, session]);

  const isCurrent =
    getFileIdentity(analysis.variables?.file) === fileIdentity &&
    !analysis.variables?.signal.aborted;
  const isPending = isCurrent && analysis.isPending;
  const error = isCurrent && analysis.error;
  const suggestions = isCurrent ? analysis.data : undefined;
  const title = suggestions?.title ?? '';
  const proposedLanguages = suggestions?.languages ?? [];
  const availableLanguages = proposedLanguages
    .map(id => languages.find(language => language.id === id))
    .filter(Boolean);
  const language =
    availableLanguages.find(item => item.id === selectedLanguageId) ??
    availableLanguages[0];
  const mainLanguage = language?.id ?? '';
  const languageName = value =>
    value
      ? formatMessage({ id: value.refName, defaultMessage: value.refName })
      : '';
  const currentLanguage = languages.find(
    item => item.id === document.mainLanguage
  );
  const isLoadingLanguages =
    proposedLanguages.length > 0 && areLanguagesPending;
  const description = suggestions?.descriptions[descriptionIndex] ?? '';
  const datePublication = suggestions?.datePublication ?? '';
  const hasResult = suggestions !== undefined;
  const values = { title, mainLanguage, description, datePublication };
  const hasSuggestions = Object.values(values).some(Boolean);
  const shouldApply = field =>
    selection[field] && !!values[field] && values[field] !== document[field];
  const selectedFields = Object.keys(values).filter(shouldApply);
  const canApply = selectedFields.length > 0;
  const replacementCount = selectedFields.filter(
    field =>
      document[field] && (field !== 'mainLanguage' || document[field] !== '000')
  ).length;
  const hasChanges = Object.keys(values).some(
    field => values[field] && values[field] !== document[field]
  );
  const handleSelectionChange = field => event => {
    const { checked } = event.target;
    setSelection(previous => ({ ...previous, [field]: checked }));
  };
  const isTooLarge =
    file instanceof File && file.size > DOCUMENT_AI_MAX_FILE_SIZE;
  const maxFileSizeMb = formatNumber(DOCUMENT_AI_LIMITS.sizeMb);
  const actionLabel = formatMessage({
    id: hasSuggestions ? 'documentAi.reviewAction' : 'documentAi.analyze'
  });
  const fieldLabels = {
    title: 'Title',
    mainLanguage: 'Document main language',
    description: 'Summary of document content',
    datePublication: 'Publication Date'
  };
  const currentValues = {
    title: document.title ?? '',
    mainLanguage:
      document.mainLanguage && document.mainLanguage !== '000'
        ? languageName(currentLanguage) || document.mainLanguage
        : '',
    description: document.description ?? '',
    datePublication: document.datePublication ?? ''
  };
  const displayValues = { ...values, mainLanguage: languageName(language) };
  const valueControls = {
    mainLanguage: availableLanguages.length > 1 && (
      <TextField
        select
        fullWidth
        size="small"
        label={formatMessage({ id: 'Document main language' })}
        value={mainLanguage}
        disabled={disabled}
        onChange={event => setSelectedLanguageId(event.target.value)}>
        {availableLanguages.map(item => (
          <MenuItem key={item.id} value={item.id}>
            {languageName(item)}
          </MenuItem>
        ))}
      </TextField>
    ),
    description: suggestions?.descriptions.length > 1 && (
      <Box>
        <TextField
          select
          fullWidth
          size="small"
          label={formatMessage({ id: 'Summary of document content' })}
          value={descriptionIndex}
          disabled={disabled}
          onChange={event => setDescriptionIndex(Number(event.target.value))}
          sx={{ mb: 1.5 }}>
          {suggestions.descriptions.map((value, index) => (
            <MenuItem key={value} value={index}>
              {formatMessage(
                { id: 'documentAi.summaryOption' },
                { number: index + 1 }
              )}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="body2">{description}</Typography>
      </Box>
    )
  };

  const handleAnalyze = () => {
    if (disabled || isPending || isTooLarge) return;
    setSelection(EMPTY_SELECTION);
    setDescriptionIndex(0);
    setSelectedLanguageId('');
    controller.current?.abort();
    controller.current = new AbortController();
    analysis.mutate({ file, signal: controller.current.signal });
  };
  const handleClose = () => {
    if (isPending) {
      controller.current?.abort();
      analysis.reset();
    }
    setIsOpen(false);
  };
  const handleApply = () => {
    if (disabled || !canApply) return;
    selectedFields.forEach(field => updateAttribute(field, values[field]));
    setSelection(EMPTY_SELECTION);
    setIsOpen(false);
  };

  const closeButton = (
    <Button
      key="close"
      type="button"
      size="small"
      variant="outlined"
      color="primary"
      sx={{ flexShrink: 0 }}
      onClick={handleClose}>
      {formatMessage({ id: isPending ? 'Cancel' : 'Close' })}
    </Button>
  );
  const restartButton = !isPending && hasSuggestions && (
    <Tooltip
      key="restart"
      title={formatMessage({ id: 'documentAi.newAnalysis' })}>
      <Box
        component="span"
        sx={{ display: 'inline-flex', mr: { sm: 'auto' }, flexShrink: 0 }}>
        <Button
          type="button"
          size="small"
          variant="outlined"
          startIcon={<RefreshOutlined />}
          aria-label={formatMessage({ id: 'documentAi.newAnalysis' })}
          disabled={disabled}
          sx={{
            minWidth: { xs: 44, sm: 'auto' },
            px: { xs: 1, sm: 1.5 },
            '& .MuiButton-startIcon': {
              m: 0,
              mr: 1
            }
          }}
          onClick={() => {
            analysis.reset();
            setSelection(EMPTY_SELECTION);
          }}>
          <Box component="span">
            {formatMessage({ id: 'documentAi.newAnalysis' })}
          </Box>
        </Button>
      </Box>
    </Tooltip>
  );
  const primaryButton = !isPending && (
    <Button
      key="primary"
      type="button"
      size="small"
      variant="contained"
      disabled={
        disabled ||
        (hasSuggestions ? !canApply : isTooLarge || isLoadingLanguages)
      }
      startIcon={hasSuggestions ? <CheckOutlined /> : <AutoAwesomeOutlined />}
      onClick={hasSuggestions ? handleApply : handleAnalyze}
      data-testid={
        hasSuggestions ? 'document-ai-apply' : 'document-ai-confirm'
      }>
      {formatMessage({
        id: hasSuggestions ? 'documentAi.apply' : 'documentAi.start'
      })}
    </Button>
  );

  return (
    <>
      <Tooltip title={actionLabel}>
        <Box
          component="span"
          sx={{ display: 'inline-flex' }}
          data-testid="document-ai">
          <Button
            type="button"
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<AutoAwesomeOutlined sx={{ fontSize: 18 }} />}
            aria-label={actionLabel}
            disabled={disabled}
            onClick={() => setIsOpen(true)}
            data-testid="document-ai-analyze"
            sx={{
              textTransform: 'none',
              minWidth: { xs: 32, sm: 'auto' },
              height: 32,
              px: { xs: 0.5, sm: 1.5 },
              py: 0.5,
              whiteSpace: 'nowrap',
              '& .MuiButton-startIcon': { m: 0, mr: { xs: 0, sm: 0.75 } }
            }}>
            <Box
              component="span"
              sx={{ display: { xs: 'none', sm: 'inline' } }}>
              {actionLabel}
            </Box>
          </Button>
        </Box>
      </Tooltip>
      <StandardDialog
        open={isOpen}
        onClose={handleClose}
        isBusy={isPending}
        fullScreen={isMobile}
        fullWidth
        maxWidth={hasSuggestions ? 'md' : 'sm'}
        aria-labelledby={titleId}
        aria-describedby={`${fileId} ${descriptionId}`}
        dividers
        stackActionsOnMobile={false}
        title={formatMessage({
          id: hasSuggestions ? 'documentAi.choose' : 'documentAi.analyze'
        })}
        actions={
          <Box sx={{ width: '100%' }}>
            {hasSuggestions && (
              <Box sx={{ mb: canApply || !hasChanges ? 1 : 0 }}>
                <Box
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  data-testid="document-ai-selection"
                  sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 1.5 }}>
                  {(canApply || !hasChanges) && (
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {formatMessage(
                        {
                          id: canApply
                            ? 'documentAi.selectionCount'
                            : 'documentAi.noChanges'
                        },
                        { count: selectedFields.length }
                      )}
                    </Typography>
                  )}
                  {replacementCount > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {formatMessage(
                        { id: 'documentAi.replacementCount' },
                        { count: replacementCount }
                      )}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            <ResponsiveActionRow>
              {restartButton}
              {closeButton}
              {primaryButton}
            </ResponsiveActionRow>
          </Box>
        }>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            mb: 2.5,
            minWidth: 0
          }}>
          <PictureAsPdfOutlined
            color="action"
            fontSize="small"
            sx={{ mt: 0.25 }}
          />
          <Typography
            id={fileId}
            variant="body2"
            sx={{ overflowWrap: 'anywhere', minWidth: 0 }}>
            {file.name ?? file.fileName}
          </Typography>
        </Box>
        {isPending && (
          <Stack spacing={1.5} role="status">
            <Typography id={descriptionId}>
              {formatMessage({ id: 'documentAi.pending' })}
            </Typography>
            <LinearProgress
              aria-label={formatMessage({ id: 'documentAi.pending' })}
            />
          </Stack>
        )}
        {!isPending && !hasResult && (
          <Stack spacing={2}>
            <Typography id={descriptionId} variant="body1">
              {formatMessage({ id: 'documentAi.consent' })}
            </Typography>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="h5" component="h3" sx={{ mb: 1 }}>
                {formatMessage({ id: 'documentAi.limits' })}
              </Typography>
              <Box
                component="ul"
                sx={{ m: 0, pl: 2.5, '& li + li': { mt: 1 } }}>
                <li>
                  <Typography variant="body2">
                    {formatMessage(
                      { id: 'documentAi.userLimits' },
                      {
                        daily: DOCUMENT_AI_LIMITS.dailyPerUser,
                        parallel: DOCUMENT_AI_LIMITS.concurrentPerUser
                      }
                    )}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    {formatMessage(
                      { id: 'documentAi.globalLimit' },
                      { total: DOCUMENT_AI_LIMITS.dailyTotal }
                    )}
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    {formatMessage(
                      { id: 'documentAi.fileLimits' },
                      {
                        size: maxFileSizeMb,
                        pages: DOCUMENT_AI_LIMITS.pages
                      }
                    )}
                  </Typography>
                </li>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {formatMessage({ id: 'documentAi.checkAccuracy' })}
            </Typography>
            {isTooLarge && (
              <Alert severity="error">
                {formatMessage(
                  { id: 'documentAi.tooLarge' },
                  { size: maxFileSizeMb }
                )}
              </Alert>
            )}
          </Stack>
        )}
        {error && error.name !== 'AbortError' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formatMessage({ id: getErrorMessage(error) })}
            {error.traceId && (
              <Typography
                component="div"
                variant="body2"
                data-testid="document-ai-reference"
                sx={{
                  mt: 0.5,
                  overflowWrap: 'anywhere',
                  userSelect: 'text'
                }}>
                {formatMessage(
                  { id: 'documentAi.reference' },
                  { id: error.traceId }
                )}
              </Typography>
            )}
          </Alert>
        )}
        {hasResult && isLoadingLanguages && (
          <Typography role="status">
            {formatMessage({ id: 'Loading ...' })}
          </Typography>
        )}
        {hasResult && !hasSuggestions && !isLoadingLanguages && (
          <Alert severity="info" id={descriptionId}>
            {formatMessage({ id: 'documentAi.empty' })}
          </Alert>
        )}
        {hasSuggestions && (
          <Box data-testid="document-ai-suggestions">
            <Typography
              id={descriptionId}
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5, maxWidth: '72ch' }}>
              {formatMessage({ id: 'documentAi.review' })}
            </Typography>
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <DocumentAiComparisonHeader />
              {Object.keys(values)
                .filter(field => values[field])
                .map(field => (
                  <DocumentAiSuggestion
                    key={field}
                    name={field}
                    label={formatMessage({ id: fieldLabels[field] })}
                    currentValue={currentValues[field]}
                    suggestedValue={displayValues[field]}
                    isSame={values[field] === document[field]}
                    selected={shouldApply(field)}
                    disabled={disabled}
                    onChange={handleSelectionChange(field)}
                    valueControl={valueControls[field]}
                  />
                ))}
            </Box>
          </Box>
        )}
      </StandardDialog>
    </>
  );
};

PdfAnalysisRequest.propTypes = {
  file: analysisFileType.isRequired,
  disabled: PropTypes.bool.isRequired
};

const DocumentPdfAnalysis = ({ file, disabled = false }) => {
  const { isAuth } = usePermissions();
  const isOnline = useOnlineStatus();
  const userId = useSelector(state => state.login.authTokenDecoded?.id);
  if (!isAuth) return null;
  return (
    <PdfAnalysisRequest
      key={userId}
      file={file}
      disabled={disabled || !isOnline}
    />
  );
};

DocumentPdfAnalysis.propTypes = {
  file: analysisFileType.isRequired,
  disabled: PropTypes.bool
};

export default DocumentPdfAnalysis;
