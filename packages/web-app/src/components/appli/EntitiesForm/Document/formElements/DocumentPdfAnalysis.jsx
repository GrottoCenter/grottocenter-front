import { useContext, useEffect, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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

import { useAnalyzeDocument } from '@/hooks/mutations/useAnalyzeDocument';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { usePermissions } from '@/hooks/usePermissions';
import { DOCUMENT_AI_LIMITS } from '@/utils/documentAnalysis';
import { DocumentFormContext } from '../Provider';

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

const EMPTY_SELECTION = { description: false, datePublication: false };

const PdfAnalysisRequest = ({ file, disabled }) => {
  const { formatMessage } = useIntl();
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const analysis = useAnalyzeDocument();
  const controller = useRef(null);
  const session = useSelector(state => state.login.authToken);
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState(EMPTY_SELECTION);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const titleId = useId();
  const fileId = useId();

  useEffect(() => () => controller.current?.abort(), [file, session]);

  const isCurrent =
    analysis.variables?.file === file && !analysis.variables?.signal.aborted;
  const isPending = isCurrent && analysis.isPending;
  const error = isCurrent && analysis.error;
  const suggestions = isCurrent ? analysis.data : undefined;
  const description = suggestions?.descriptions[descriptionIndex] ?? '';
  const datePublication = suggestions?.datePublication ?? '';
  const hasResult = suggestions !== undefined;
  const hasSuggestions = !!(description || datePublication);
  const shouldApplyDescription =
    selection.description &&
    !!description &&
    description !== document.description;
  const shouldApplyDate =
    selection.datePublication &&
    !!datePublication &&
    datePublication !== document.datePublication;
  const canApply = shouldApplyDescription || shouldApplyDate;
  const hasReplacement =
    (shouldApplyDescription && !!document.description) ||
    (shouldApplyDate && !!document.datePublication);
  const isTooLarge = file.size > DOCUMENT_AI_LIMITS.sizeMb * 1000000;
  const actionLabel = formatMessage({
    id: hasSuggestions ? 'documentAi.reviewAction' : 'documentAi.analyze'
  });

  const handleAnalyze = () => {
    if (disabled || isPending || isTooLarge) return;
    setSelection(EMPTY_SELECTION);
    setDescriptionIndex(0);
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
    if (shouldApplyDescription) updateAttribute('description', description);
    if (shouldApplyDate) updateAttribute('datePublication', datePublication);
    setSelection(EMPTY_SELECTION);
    setIsOpen(false);
  };

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
            variant={isMobile ? 'text' : 'contained'}
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
      <Dialog
        open={isOpen}
        onClose={handleClose}
        fullScreen={isMobile}
        fullWidth
        maxWidth="md"
        aria-labelledby={titleId}
        aria-describedby={fileId}>
        <DialogTitle id={titleId}>
          {formatMessage({
            id: hasSuggestions ? 'documentAi.choose' : 'documentAi.analyze'
          })}
        </DialogTitle>
        <DialogContent dividers>
          <Typography
            id={fileId}
            variant="body2"
            sx={{ fontWeight: 600, overflowWrap: 'anywhere', mb: 2 }}>
            {file.name}
          </Typography>
          {isPending && (
            <Stack spacing={1.5} role="status">
              <Typography>
                {formatMessage({ id: 'documentAi.pending' })}
              </Typography>
              <LinearProgress
                aria-label={formatMessage({ id: 'documentAi.pending' })}
              />
            </Stack>
          )}
          {!isPending && !hasResult && (
            <Stack spacing={2}>
              <Typography variant="body2">
                {formatMessage({ id: 'documentAi.consent' })}
              </Typography>
              <Box>
                <Typography variant="h5" component="h3" sx={{ mb: 1 }}>
                  {formatMessage({ id: 'documentAi.limits' })}
                </Typography>
                <Box
                  component="ul"
                  sx={{ m: 0, pl: 2.5, '& li + li': { mt: 0.75 } }}>
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
                          size: DOCUMENT_AI_LIMITS.sizeMb,
                          pages: DOCUMENT_AI_LIMITS.pages
                        }
                      )}
                    </Typography>
                  </li>
                </Box>
              </Box>
              {isTooLarge && (
                <Alert severity="error">
                  {formatMessage(
                    { id: 'documentAi.tooLarge' },
                    { size: DOCUMENT_AI_LIMITS.sizeMb }
                  )}
                </Alert>
              )}
            </Stack>
          )}
          {error && error.name !== 'AbortError' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formatMessage({ id: getErrorMessage(error) })}
            </Alert>
          )}
          {hasResult && !hasSuggestions && (
            <Alert severity="info">
              {formatMessage({ id: 'documentAi.empty' })}
            </Alert>
          )}
          {hasSuggestions && (
            <Stack
              spacing={2.5}
              data-testid="document-ai-suggestions"
              sx={{ maxWidth: '72ch' }}>
              <Typography variant="body2" color="text.secondary">
                {formatMessage({ id: 'documentAi.review' })}
              </Typography>
              {!!description && (
                <Box sx={{ pb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shouldApplyDescription}
                        disabled={description === document.description}
                        onChange={event =>
                          setSelection(previous => ({
                            ...previous,
                            description: event.target.checked
                          }))
                        }
                      />
                    }
                    label={formatMessage({ id: 'Summary of document content' })}
                  />
                  {suggestions.descriptions.length > 1 && (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label={formatMessage({
                        id: 'Summary of document content'
                      })}
                      value={descriptionIndex}
                      onChange={event =>
                        setDescriptionIndex(Number(event.target.value))
                      }
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
                  )}
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {description}
                  </Typography>
                  {!!document.description && (
                    <Box component="details" sx={{ mt: 1.5 }}>
                      <Typography
                        component="summary"
                        variant="body2"
                        sx={{ cursor: 'pointer', color: 'text.secondary' }}>
                        {formatMessage({ id: 'documentAi.currentValue' })}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          whiteSpace: 'pre-wrap',
                          overflowWrap: 'anywhere'
                        }}>
                        {document.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              {!!datePublication && (
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shouldApplyDate}
                        disabled={datePublication === document.datePublication}
                        onChange={event =>
                          setSelection(previous => ({
                            ...previous,
                            datePublication: event.target.checked
                          }))
                        }
                      />
                    }
                    label={formatMessage({ id: 'Publication Date' })}
                  />
                  <Typography variant="body2" data-testid="document-ai-date">
                    {datePublication}
                  </Typography>
                  {!!document.datePublication && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}>
                      {formatMessage({ id: 'documentAi.currentValue' })}:{' '}
                      {document.datePublication}
                    </Typography>
                  )}
                </Box>
              )}
              {hasReplacement && (
                <Alert severity="warning">
                  {formatMessage({ id: 'documentAi.replace' })}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            gap: 1,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            '& > :not(style) ~ :not(style)': { ml: 0 }
          }}>
          <Button
            type="button"
            variant="outlined"
            color={isPending ? 'error' : 'primary'}
            onClick={handleClose}>
            {formatMessage({
              id: isPending ? 'Cancel' : 'Close'
            })}
          </Button>
          {!isPending && hasSuggestions && (
            <Button
              type="button"
              variant="outlined"
              startIcon={<RefreshOutlined />}
              disabled={disabled}
              onClick={() => {
                analysis.reset();
                setSelection(EMPTY_SELECTION);
              }}>
              {formatMessage({ id: 'documentAi.newAnalysis' })}
            </Button>
          )}
          {!isPending && !hasSuggestions && (
            <Button
              type="button"
              variant="contained"
              startIcon={<AutoAwesomeOutlined />}
              disabled={disabled || isTooLarge}
              onClick={handleAnalyze}
              data-testid="document-ai-confirm">
              {formatMessage({ id: 'documentAi.start' })}
            </Button>
          )}
          {!isPending && hasSuggestions && (
            <Button
              type="button"
              variant="contained"
              disabled={disabled || !canApply}
              startIcon={<CheckOutlined />}
              onClick={handleApply}
              data-testid="document-ai-apply">
              {formatMessage({ id: 'documentAi.apply' })}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

PdfAnalysisRequest.propTypes = {
  file: PropTypes.instanceOf(File).isRequired,
  disabled: PropTypes.bool.isRequired
};

const DocumentPdfAnalysis = ({ file, disabled = false }) => {
  const { isNewDocument } = useContext(DocumentFormContext);
  const { isAuth, isModerator } = usePermissions();
  const isOnline = useOnlineStatus();
  const userId = useSelector(state => state.login.authTokenDecoded?.id);
  if (!isNewDocument || !isAuth || !isModerator) return null;
  return (
    <PdfAnalysisRequest
      key={userId}
      file={file}
      disabled={disabled || !isOnline}
    />
  );
};

DocumentPdfAnalysis.propTypes = {
  file: PropTypes.instanceOf(File).isRequired,
  disabled: PropTypes.bool
};

export default DocumentPdfAnalysis;
