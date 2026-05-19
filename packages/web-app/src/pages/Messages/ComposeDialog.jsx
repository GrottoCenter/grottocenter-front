import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress
} from '@mui/material';
import StandardDialog from '../../components/common/StandardDialog';
import AutoCompleteSearch from '../../components/common/AutoCompleteSearch';
import { fetchQuicksearchResult, resetQuicksearch } from '../../actions/Quicksearch';
import { sendMessage } from '../../actions/Messaging/SendMessage';
import { fetchPerson } from '../../actions/Person/GetPerson';
import { useDebounce } from '../../hooks';
import { AUTOCOMPLETE_DEBOUNCE_DELAY, AUTOCOMPLETE_MIN_CHARACTERS } from '../../conf/config';

const ComposeDialog = ({ open, onClose, prefilledRecipientId }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { results: searchResults, isLoading: isSearchLoading, errors: searchErrors } = useSelector(
    state => state.quicksearch
  );

  const { person: fetchedPerson, isFetching: isPersonFetching } = useSelector(state => state.person);
  const myCaverId = useSelector(state => state.login.authTokenDecoded?.id);

  const [recipient, setRecipient] = useState(null);
  const [recipientInput, setRecipientInput] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const debouncedInput = useDebounce(recipientInput, AUTOCOMPLETE_DEBOUNCE_DELAY);

  // Debounced recipient search
  useEffect(() => {
    if (debouncedInput.length < AUTOCOMPLETE_MIN_CHARACTERS) {
      dispatch(resetQuicksearch());
      return;
    }
    // Avoid re-searching if selected recipient matches exactly
    if (recipient && `${recipient.nickname} (${recipient.id})` === debouncedInput) {
      return;
    }
    dispatch(
      fetchQuicksearchResult({
        query: debouncedInput.trim(),
        entities: ['persons']
      })
    );
  }, [debouncedInput, dispatch, recipient]);

  // Load prefilled recipient if prefilledRecipientId changes
  useEffect(() => {
    if (open && prefilledRecipientId) {
      dispatch(fetchPerson(prefilledRecipientId));
    }
  }, [open, prefilledRecipientId, dispatch]);

  useEffect(() => {
    if (open && prefilledRecipientId && fetchedPerson && String(fetchedPerson.id) === String(prefilledRecipientId)) {
      setRecipient({
        id: fetchedPerson.id,
        nickname: fetchedPerson.nickname
      });
      setRecipientInput(`${fetchedPerson.nickname} (${fetchedPerson.id})`);
    }
  }, [fetchedPerson, prefilledRecipientId, open]);

  // Reset state when closing dialog
  const handleClose = () => {
    setRecipient(null);
    setRecipientInput('');
    setBody('');
    setSendError(null);
    dispatch(resetQuicksearch());
    onClose();
  };

  const handleSend = async () => {
    if (!recipient || !body.trim()) return;
    setIsSending(true);
    setSendError(null);

    try {
      const message = await dispatch(sendMessage({ recipientId: recipient.id, body: body.trim() }));
      setIsSending(false);
      if (message && message.conversation) {
        navigate(`/ui/messages/${message.conversation}`);
      } else {
        navigate('/ui/messages');
      }
      handleClose();
    } catch (err) {
      setIsSending(false);
      setSendError(err.message || formatMessage({ id: 'Failed to send message.' }));
    }
  };

  const renderRecipientOption = (props, option) => {
    const { key, ...otherProps } = props;
    return (
      <li key={key || `recipient-${option.id}`} {...otherProps}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {option.nickname}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ID: {option.id}
          </Typography>
        </Box>
      </li>
    );
  };

  const getOptionLabel = option => {
    if (typeof option === 'string') return option;
    return option?.nickname ? `${option.nickname} (${option.id})` : '';
  };

  const isFormValid = recipient && body.trim().length > 0 && body.length <= 5000;

  const filteredSuggestions = (searchResults || []).filter(
    option => Number(option.id) !== Number(myCaverId)
  );

  return (
    <StandardDialog
      open={open}
      onClose={isSending ? undefined : handleClose}
      title={formatMessage({ id: 'New Message', defaultMessage: 'New Message' })}
      fullWidth
      maxWidth="sm"
      actions={
        <>
          <Button onClick={handleClose} disabled={isSending}>
            {formatMessage({ id: 'Cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button
            onClick={handleSend}
            variant="contained"
            color="primary"
            disabled={!isFormValid || isSending}
          >
            {isSending ? <CircularProgress size={24} /> : formatMessage({ id: 'Send', defaultMessage: 'Send' })}
          </Button>
        </>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: -1 }}>
          {formatMessage({ id: 'To', defaultMessage: 'To' })}
        </Typography>

        {isPersonFetching && prefilledRecipientId && !recipient ? (
          <CircularProgress size={20} />
        ) : (
          <AutoCompleteSearch
            inputValue={recipientInput}
            onInputChange={setRecipientInput}
            suggestions={filteredSuggestions}
            onSelection={(selection) => {
              if (selection) {
                setRecipient(selection);
                setRecipientInput(`${selection.nickname} (${selection.id})`);
              } else {
                setRecipient(null);
                setRecipientInput('');
              }
            }}
            getOptionLabel={getOptionLabel}
            renderOption={renderRecipientOption}
            label={formatMessage({ id: 'Search recipient...', defaultMessage: 'Search recipient...' })}
            isLoading={isSearchLoading}
            hasError={!!searchErrors}
            disabled={isSending || !!prefilledRecipientId}
            hasFixWidth={true}
          />
        )}

        <TextField
          label={formatMessage({ id: 'Message body', defaultMessage: 'Message body' })}
          multiline
          rows={6}
          fullWidth
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={isSending}
          inputProps={{ maxLength: 5100 }}
          error={body.length > 5000}
          helperText={
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ color: body.length > 5000 ? 'red' : 'inherit' }}>
                {body.length > 5000
                  ? formatMessage({ id: 'Message exceeds 5000 characters limit.', defaultMessage: 'Message exceeds 5000 characters limit.' })
                  : ''}
              </span>
              <span>{body.length} / 5000</span>
            </Box>
          }
        />

        {sendError && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {sendError}
          </Typography>
        )}
      </Box>
    </StandardDialog>
  );
};

ComposeDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  prefilledRecipientId: PropTypes.string
};

export default ComposeDialog;
