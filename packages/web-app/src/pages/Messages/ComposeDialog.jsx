import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Box,
  TextField,
  Typography,
  Button,
  CircularProgress,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StandardDialog from '../../components/common/StandardDialog';
import { sendMessage } from '../../actions/Messaging/SendMessage';
import { fetchPerson } from '../../actions/Person/GetPerson';
import { useEntitySearch } from '../../hooks';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '../../conf/config';

const PERSON_ENTITIES = ['persons'];
const CAVER_FILTER = { type: 'CAVER' };

const ComposeDialog = ({ open, onClose, prefilledRecipientId }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { person: fetchedPerson, isFetching: isPersonFetching } = useSelector(
    state => state.person
  );
  const myCaverId = useSelector(state => state.login.authTokenDecoded?.id);

  const [recipient, setRecipient] = useState(null);
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const {
    inputValue: recipientInput,
    setInputValue: setRecipientInput,
    results: searchResults,
    isLoading: isSearchLoading,
    hasError: searchError
  } = useEntitySearch(PERSON_ENTITIES, {
    filter: CAVER_FILTER,
    // Selected recipients already fill the input with their label; skip the
    // extra request that would just return the same match.
    skipQuery: recipient ? `${recipient.nickname} (${recipient.id})` : undefined
  });

  // Load prefilled recipient if prefilledRecipientId changes
  useEffect(() => {
    if (open && prefilledRecipientId) {
      dispatch(fetchPerson(prefilledRecipientId));
    }
  }, [open, prefilledRecipientId, dispatch]);

  // Prefill the recipient when the fetched person matches the id we asked
  // for. `open` is deliberately NOT in the deps: it would re-trigger the
  // prefill (overwriting a manually edited recipient) if the store's
  // `state.person.person` happens to change while this dialog stays open.
  useEffect(() => {
    if (!prefilledRecipientId || !fetchedPerson) return;
    if (String(fetchedPerson.id) !== String(prefilledRecipientId)) return;
    if (fetchedPerson.type === 'AUTHOR') {
      setSendError(
        formatMessage({
          id: 'You cannot send a message to an author without an account.',
          defaultMessage:
            'You cannot send a message to an author without an account.'
        })
      );
      setRecipient(null);
      setRecipientInput('');
    } else {
      setRecipient({
        id: fetchedPerson.id,
        nickname: fetchedPerson.nickname
      });
      setRecipientInput(`${fetchedPerson.nickname} (${fetchedPerson.id})`);
      setSendError(null);
    }
  }, [fetchedPerson, prefilledRecipientId, formatMessage, setRecipientInput]);

  // Reset state when closing dialog
  const handleClose = () => {
    setRecipient(null);
    setRecipientInput('');
    setBody('');
    setSendError(null);
    onClose();
  };

  const handleSend = async () => {
    if (!recipient || !body.trim()) return;
    setIsSending(true);
    setSendError(null);

    try {
      const message = await dispatch(
        sendMessage({
          recipientId: recipient.id,
          body: body.trim(),
          recipient: { id: recipient.id, nickname: recipient.nickname }
        })
      );
      setIsSending(false);
      if (message && message.conversation) {
        navigate(`/ui/messages/${message.conversation}`);
      } else {
        navigate('/ui/messages');
      }
      handleClose();
    } catch (err) {
      setIsSending(false);
      setSendError(
        err.message || formatMessage({ id: 'Failed to send message.' })
      );
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

  const isFormValid =
    recipient && body.trim().length > 0 && body.length <= 5000;

  // Exclude the current user and author-only accounts from the suggestions.
  const filteredSuggestions = (searchResults || []).filter(
    option =>
      Number(option.id) !== Number(myCaverId) && option.type !== 'AUTHOR'
  );

  const isRecipientDisabled = isSending || !!prefilledRecipientId;

  return (
    <StandardDialog
      open={open}
      onClose={isSending ? undefined : handleClose}
      title={formatMessage({
        id: 'New Message',
        defaultMessage: 'New Message'
      })}
      fullScreen={isMobile}
      fullWidth
      maxWidth="sm"
      actions={
        <>
          <Button onClick={handleClose} disabled={isSending} variant="outlined">
            {formatMessage({ id: 'Cancel', defaultMessage: 'Cancel' })}
          </Button>
          <Button
            onClick={handleSend}
            variant="contained"
            color="primary"
            disabled={!isFormValid || isSending}
            startIcon={
              isSending ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )
            }>
            {formatMessage({ id: 'Send', defaultMessage: 'Send' })}
          </Button>
        </>
      }>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          pt: 0.5,
          height: isMobile ? '100%' : 'auto'
        }}>
        {isPersonFetching && prefilledRecipientId && !recipient ? (
          <CircularProgress size={20} />
        ) : (
          <Autocomplete
            value={recipient}
            inputValue={recipientInput}
            onChange={(_event, selection) => {
              setSendError(null);
              if (selection && typeof selection !== 'string') {
                setRecipient(selection);
                setRecipientInput(`${selection.nickname} (${selection.id})`);
              } else {
                setRecipient(null);
                setRecipientInput('');
              }
            }}
            onInputChange={(_event, newValue, reason) => {
              if (reason === 'reset' || reason === 'clear') {
                setRecipientInput(reason === 'clear' ? '' : newValue);
              } else {
                setRecipientInput(newValue);
              }
            }}
            options={filteredSuggestions}
            filterOptions={x => x}
            getOptionLabel={getOptionLabel}
            renderOption={renderRecipientOption}
            isOptionEqualToValue={(option, val) =>
              option && val && String(option.id) === String(val.id)
            }
            loading={isSearchLoading}
            disabled={isRecipientDisabled}
            noOptionsText={formatMessage(
              { id: 'No result (enter at least {count} characters)' },
              { count: AUTOCOMPLETE_MIN_CHARACTERS }
            )}
            renderInput={params => (
              <TextField
                {...params}
                variant="filled"
                label={formatMessage({
                  id: 'To',
                  defaultMessage: 'To'
                })}
                error={!!searchError}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isSearchLoading && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
              />
            )}
          />
        )}

        <TextField
          label={formatMessage({
            id: 'Message body',
            defaultMessage: 'Message body'
          })}
          multiline
          rows={isMobile ? undefined : 6}
          fullWidth
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={isSending}
          // On mobile the dialog is fullscreen: let the textarea eat the
          // leftover height instead of leaving a gap above the actions.
          sx={
            isMobile
              ? {
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  '& .MuiInputBase-root': {
                    flexGrow: 1,
                    alignItems: 'stretch'
                  },
                  '& .MuiInputBase-inputMultiline': {
                    height: '100% !important'
                  }
                }
              : undefined
          }
          slotProps={{ htmlInput: { maxLength: 5100 } }}
          error={body.length > 5000}
          helperText={
            // FormHelperText renders a <p>, which cannot contain a <div>.
            <Box
              component="span"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%'
              }}>
              <span style={{ color: body.length > 5000 ? 'red' : 'inherit' }}>
                {body.length > 5000
                  ? formatMessage({
                      id: 'Message exceeds 5000 characters limit.',
                      defaultMessage: 'Message exceeds 5000 characters limit.'
                    })
                  : ''}
              </span>
              <span>{body.length} / 5000</span>
            </Box>
          }
        />

        {sendError && (
          <Typography color="error" variant="body2" sx={{ mt: 0.5 }}>
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
