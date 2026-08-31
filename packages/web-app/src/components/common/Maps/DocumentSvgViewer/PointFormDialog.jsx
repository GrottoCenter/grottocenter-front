import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// Create (point = null) or edit (point provided) a point's name + document ids.
// The coordinates are handled by the viewer, not this form. `container` keeps the
// dialog visible in fullscreen (see useFullscreenContainer).
const PointFormDialog = ({
  open,
  point = null,
  container = null,
  onClose,
  onSubmit
}) => {
  const { formatMessage } = useIntl();
  const isEdit = Boolean(point);
  const [label, setLabel] = useState('');
  const [documents, setDocuments] = useState([]);
  const [docInput, setDocInput] = useState('');

  // Sync fields with the edited point (or reset) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setLabel(point?.label ?? '');
    setDocuments(point?.documents?.map(d => d.documentId) ?? []);
    setDocInput('');
  }, [open, point]);

  const addDocument = () => {
    const id = parseInt(docInput, 10);
    if (Number.isNaN(id)) return;
    setDocuments(prev => (prev.includes(id) ? prev : [...prev, id]));
    setDocInput('');
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!label.trim()) return;
    onSubmit({ label: label.trim(), documents });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      container={container}
    >
      <form onSubmit={handleSubmit}>
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

            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  label={formatMessage({ id: 'Document ID' })}
                  type="number"
                  value={docInput}
                  onChange={e => setDocInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addDocument();
                    }
                  }}
                  size="small"
                  fullWidth
                />
                <IconButton
                  onClick={addDocument}
                  aria-label={formatMessage({ id: 'Add' })}
                >
                  <AddIcon />
                </IconButton>
              </Box>
              {documents.length > 0 && (
                <Stack direction="row" sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
                  {documents.map(id => (
                    <Chip
                      key={id}
                      label={`#${id}`}
                      size="small"
                      onDelete={() =>
                        setDocuments(prev => prev.filter(d => d !== id))
                      }
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={label.trim().length === 0}
          >
            {formatMessage({ id: isEdit ? 'Save' : 'Create' })}
          </Button>
        </DialogActions>
      </form>
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
        documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
      })
    )
  }),
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default PointFormDialog;
