import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Autocomplete,
  CircularProgress,
  Collapse,
  IconButton,
  TextField,
  Typography
} from '@mui/material';
import AddCircle from '@mui/icons-material/AddCircle';
import Cancel from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';
import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../actions/Quicksearch';
import { entityOptionForSelector } from '../../../helpers/Entity';
import { useDebounce } from '../../../hooks';
import CreateCaverPanel from './CreateCaverPanel';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const InputWrapper = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const CHIP_SLOT_PROPS = { chip: { color: 'primary' } };
const MIN_SEARCH_LENGTH = 3;

const HELPER_TEXT_KEY =
  'Choose one or more authors among those already registered. If the author you are looking for does not exist in Grottocenter, it is possible to add him/her using the + button on the right.';

const AuthorsSelect = ({
  value = [],
  onChange,
  label,
  required = false,
  noOptionsText
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const {
    error: searchError,
    isLoading,
    results: searchResults
  } = useSelector(state => state.quicksearch);

  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [sideActionEnabled, setSideActionEnabled] = useState(false);
  const [defaultNewSurname, setDefaultNewSurname] = useState('');

  useEffect(() => {
    if (debouncedInput.length >= MIN_SEARCH_LENGTH) {
      dispatch(
        fetchQuicksearchResult({
          query: debouncedInput.trim(),
          entities: ['persons']
        })
      );
      setDefaultNewSurname(debouncedInput.trim());
    } else {
      dispatch(resetQuicksearch());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  useEffect(() => {
    if (isLoading) {
      setSideActionEnabled(true);
    }
  }, [isLoading]);

  const handleChange = (_event, newValue) => {
    onChange(newValue);
  };

  const handleInputChange = (_event, newValue, reason) => {
    if (reason === 'reset' || reason === 'clear') {
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  const handleToggleCreate = () => {
    setCreateOpen(prev => !prev);
  };

  const handleCreateSuccess = caver => {
    onChange([...value, caver]);
    setCreateOpen(false);
  };

  const resolvedNoOptions = noOptionsText || formatMessage({
    id: 'AuthorsSelect.noOptions',
    defaultMessage: 'No caver matches your search (type at least 3 characters)'
  });

  return (
    <>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 0.5 }}>
        {formatMessage({ id: HELPER_TEXT_KEY })}
      </Typography>
      <Wrapper>
        <InputWrapper>
          <Autocomplete
            multiple
            value={value}
            options={searchResults || []}
            onChange={handleChange}
            onInputChange={handleInputChange}
            inputValue={inputValue}
            loading={isLoading}
            getOptionLabel={option => option.nickname || ''}
            renderOption={(props, option) =>
              entityOptionForSelector(props, option)
            }
            isOptionEqualToValue={(option, val) => option.id === val.id}
            filterSelectedOptions
            slotProps={CHIP_SLOT_PROPS}
            filterOptions={options => options}
            noOptionsText={
              inputValue.length >= MIN_SEARCH_LENGTH ? (
                resolvedNoOptions
              ) : (
                <span>
                  {formatMessage(
                    {
                      id: 'Type at least {nbOfChars} character(s)',
                      defaultMessage: 'Type at least {nbOfChars} character(s)'
                    },
                    { nbOfChars: <span key="minChars">{MIN_SEARCH_LENGTH}</span> }
                  )}
                </span>
              )
            }
            required={required}
            renderInput={params => (
              <TextField
                {...params}
                variant="filled"
                label={label}
                required={required}
                error={!!searchError}
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
          <Collapse in={isCreateOpen} sx={{ p: 1 }}>
            <CreateCaverPanel
              enabled={isCreateOpen}
              onCreateSuccess={handleCreateSuccess}
              defaultName=""
              defaultSurname={defaultNewSurname}
            />
          </Collapse>
        </InputWrapper>
        <IconButton
          size="small"
          onClick={handleToggleCreate}
          disabled={!sideActionEnabled}
          color="secondary"
          aria-label={formatMessage({ id: 'new entity' })}>
          {isCreateOpen ? (
            <Cancel fontSize="large" />
          ) : (
            <AddCircle fontSize="large" />
          )}
        </IconButton>
      </Wrapper>
    </>
  );
};

AuthorsSelect.propTypes = {
  value: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      nickname: PropTypes.string
    })
  ),
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  noOptionsText: PropTypes.string
};

export default AuthorsSelect;
