import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

import { entityOptionForSelector } from '@/helpers/Entity';
import { useEntitySearch } from '@/hooks';

// Fills the dialog Paper so DialogContent grows and DialogActions stays pinned
// to the bottom — matters in fullscreen (mobile), where the form would
// otherwise leave the actions floating mid-screen.
const Form = styled('form')`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
`;

const DOCUMENT_ENTITIES = ['documents'];
const MIN_SEARCH_LENGTH = 3;
const CHIP_SLOT_PROPS = { chip: { color: 'primary' } };

// Normalise a point's stored document ({ documentId, label }) into the option
// shape the search Autocomplete works with (same shape as quicksearch results).
const toOption = d => ({
  _type: 'documents',
  id: d.documentId,
  title: d.label || `#${d.documentId}`
});

// Create (point = null) or edit (point provided) a point's name + documents.
// Documents are picked through a search-driven multi-select (quicksearch on the
// `documents` entity). The coordinates are handled by the viewer, not this form.
// `container` keeps the dialog visible in fullscreen (see useFullscreenContainer).
const PointFormDialog = ({
  open,
  point = null,
  container = null,
  onClose,
  onSubmit
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit = Boolean(point);
  const [label, setLabel] = useState('');
  const [documents, setDocuments] = useState([]);
  // Snapshot of the documents at open time, to flag removals before saving.
  const [initialDocuments, setInitialDocuments] = useState([]);

  const { inputValue, setInputValue, results, isLoading, hasError } =
    useEntitySearch(DOCUMENT_ENTITIES, { minChars: MIN_SEARCH_LENGTH });

  // Sync fields with the edited point (or reset) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setLabel(point?.label ?? '');
    const docs = point?.documents?.map(toOption) ?? [];
    setDocuments(docs);
    setInitialDocuments(docs);
    setInputValue('');
  }, [open, point, setInputValue]);

  // Documents present at open but no longer selected: they will be unlinked on
  // save. Surfaced as an inline warning so an accidental chip removal is visible.
  const removedDocuments = useMemo(
    () =>
      initialDocuments.filter(
        init => !documents.some(d => String(d.id) === String(init.id))
      ),
    [initialDocuments, documents]
  );

  // Has anything actually changed vs the point at open time? Guards against a
  // no-op "save" that would wrongly report the point as modified.
  const isDirty = useMemo(() => {
    if (label.trim() !== (point?.label ?? '')) return true;
    if (documents.length !== initialDocuments.length) return true;
    const initialIds = new Set(initialDocuments.map(d => String(d.id)));
    return documents.some(d => !initialIds.has(String(d.id)));
  }, [label, documents, initialDocuments, point]);

  const handleInputChange = (_event, newValue, reason) => {
    if (reason === 'reset' || reason === 'clear') {
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!label.trim()) return;
    // Nothing changed (e.g. Enter pressed on an untouched edit): do not submit,
    // so the caller never reports a spurious "point updated".
    if (isEdit && !isDirty) {
      onClose();
      return;
    }
    onSubmit({
      label: label.trim(),
      documents: documents.map(d => ({ documentId: d.id, label: d.title }))
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      fullScreen={isMobile}
      container={container}
      slotProps={{ paper: { sx: { position: 'relative' } } }}>
      <CloseButton
        aria-label={formatMessage({ id: 'close' })}
        onClick={onClose}
        color="primary">
        <CloseIcon />
      </CloseButton>
      <Form onSubmit={handleSubmit}>
        <DialogTitle>
          {formatMessage({ id: isEdit ? 'Edit point' : 'New point' })}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              required
              label={formatMessage({ id: 'Name' })}
              value={label}
              onChange={e => setLabel(e.target.value)}
              fullWidth
            />

            <Autocomplete
              multiple
              value={documents}
              options={results}
              onChange={(_event, newValue) => setDocuments(newValue)}
              onInputChange={handleInputChange}
              inputValue={inputValue}
              loading={isLoading}
              getOptionLabel={option => option.title || ''}
              renderOption={(props, option) =>
                entityOptionForSelector(props, option)
              }
              isOptionEqualToValue={(option, val) =>
                String(option.id) === String(val.id)
              }
              filterSelectedOptions
              // Server-side search already filters — disable MUI's own filtering.
              filterOptions={x => x}
              slotProps={CHIP_SLOT_PROPS}
              noOptionsText={
                inputValue.trim().length >= MIN_SEARCH_LENGTH
                  ? formatMessage({ id: 'No result.' })
                  : formatMessage(
                      { id: 'Type at least {nbOfChars} character(s)' },
                      { nbOfChars: MIN_SEARCH_LENGTH }
                    )
              }
              renderInput={params => (
                <TextField
                  {...params}
                  label={formatMessage({ id: 'Documents' })}
                  error={hasError}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoading && <CircularProgress size={16} />}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />

            {removedDocuments.length > 0 && (
              <Alert severity="warning">
                {formatMessage({
                  id: 'These documents will be unlinked from the point on save:'
                })}{' '}
                <strong>{removedDocuments.map(d => d.title).join(', ')}</strong>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={label.trim().length === 0 || (isEdit && !isDirty)}>
            {formatMessage({ id: isEdit ? 'Save' : 'Create' })}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
};

PointFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  container: PropTypes.object,
  point: PropTypes.shape({
    label: PropTypes.string,
    documents: PropTypes.arrayOf(
      PropTypes.shape({
        documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string
      })
    )
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default PointFormDialog;
