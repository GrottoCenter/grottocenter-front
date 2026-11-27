import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useIntl } from 'react-intl';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import { personKeys } from '@/api/queryKeys';
import { useCreatePerson, useEntitySearch, useOnlineStatus } from '@/hooks';
import DocumentAuthorLabel from '@/components/common/DocumentAuthorLabel';
import InputText from '@/components/appli/EntitiesForm/utils/InputText';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { cleanupError, getPerson, sameId } from './api';
import { CleanupError } from './Feedback';
import { guessAuthorName } from './guessAuthorName';

const PERSON_ENTITIES = ['persons'];
const COMMON_AUTHORS = [
  { id: 33, label: 'organizationConversion.anonymousAuthor' },
  { id: 41378, label: 'organizationConversion.multipleAuthors' }
];

export const personShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  nickname: PropTypes.string,
  type: PropTypes.string,
  authoredCount: PropTypes.number
});

// The existing creation panel creates immediately too, but does not expose its
// busy/offline state. Keep this two-field form local to this temporary workflow
// so it can lock the conversion dialog while creating an author.
const CreateAuthor = ({ initialName, onSelect, onBusyChange }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const creation = useCreatePerson({ errorPresentation: 'inline' });
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: guessAuthorName(initialName),
    mode: 'onTouched',
    reValidateMode: 'onChange'
  });
  const handleCreate = async values => {
    onBusyChange(true);
    try {
      const person = await creation.mutateAsync({
        name: values.name.trim(),
        surname: values.surname.trim()
      });
      onSelect({ ...person, type: 'AUTHOR', authoredCount: 0 });
    } catch {
      // The mutation exposes its inline error; preserve both entered names.
    } finally {
      onBusyChange(false);
    }
  };
  return (
    <Box component="form" noValidate onSubmit={handleSubmit(handleCreate)}>
      <Stack spacing={2}>
        <Alert severity="info">
          {formatMessage({ id: 'organizationConversion.creationNote' })}
        </Alert>
        {['surname', 'name'].map(name => (
          <InputText
            key={name}
            formKey={name}
            control={control}
            labelName={name === 'name' ? 'First name' : 'Last name'}
            maxLength={
              name === 'name'
                ? TEXT_LENGTH_LIMITS.PERSON_FIRST_NAME
                : TEXT_LENGTH_LIMITS.PERSON_LAST_NAME
            }
            validatorFn={value =>
              Boolean(value.trim()) || formatMessage({ id: 'Required' })
            }
            isError={!!errors[name]}
            isRequired
            isDisabled={creation.isPending || !isOnline}
          />
        ))}
        <CleanupError error={creation.error} />
        <Button
          type="submit"
          variant="outlined"
          loading={creation.isPending}
          disabled={creation.isPending || !isOnline}
          data-testid="conversion-create-author">
          {formatMessage({ id: 'create' })}
        </Button>
      </Stack>
    </Box>
  );
};

CreateAuthor.propTypes = {
  initialName: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onBusyChange: PropTypes.func.isRequired
};

const AuthorChoice = ({
  name,
  selected = null,
  onSelect,
  onCreated,
  onBusyChange
}) => {
  const { formatMessage } = useIntl();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const [showCreation, setShowCreation] = useState(false);
  const [loadingAuthorId, setLoadingAuthorId] = useState(null);
  const [shortcutError, setShortcutError] = useState(null);
  const search = useEntitySearch(PERSON_ENTITIES, { minChars: 1 });
  const { setInputValue } = search;
  useEffect(() => setInputValue(name), [name, setInputValue]);
  const details = useQueries({
    queries: search.results.map(person => ({
      queryKey: personKeys.detail(person.id),
      queryFn: () => getPerson(person.id),
      retry: false,
      staleTime: 0
    }))
  });
  const handleCommonAuthor = async id => {
    setShortcutError(null);
    setLoadingAuthorId(id);
    onSelect(null);
    onBusyChange(true);
    try {
      const person = await queryClient.fetchQuery({
        queryKey: personKeys.detail(id),
        queryFn: () => getPerson(id),
        retry: false,
        staleTime: 0,
        meta: { errorPresentation: 'inline' }
      });
      if (
        !sameId(person?.id, id) ||
        !['AUTHOR', 'CAVER'].includes(person.type)
      ) {
        throw cleanupError('targetChanged');
      }
      if (!Number.isInteger(person.authoredCount) || person.authoredCount < 0) {
        throw cleanupError('incompleteAudit');
      }
      onSelect(person);
      setShowCreation(false);
    } catch (error) {
      setShortcutError(error);
    } finally {
      setLoadingAuthorId(null);
      onBusyChange(false);
    }
  };

  return (
    <Stack spacing={2}>
      <TextField
        label={formatMessage({ id: 'organizationConversion.search' })}
        value={search.inputValue}
        onChange={event => setInputValue(event.target.value)}
        fullWidth
        data-testid="conversion-person-search"
      />
      {search.hasError && (
        <Alert severity="error">
          {formatMessage({ id: 'organizationConversion.searchError' })}
        </Alert>
      )}
      {search.isLoading && (
        <Typography role="status">
          {formatMessage({ id: 'Loading ...' })}
        </Typography>
      )}
      {search.hasSearched && !search.hasError && !search.results.length && (
        <Typography>
          {formatMessage({ id: 'organizationConversion.noMatches' })}
        </Typography>
      )}
      <RadioGroup
        aria-label={formatMessage({ id: 'Author' })}
        value={selected ? String(selected.id) : ''}
        onChange={event => {
          const person = details.find(query =>
            sameId(query.data?.id, event.target.value)
          );
          if (person?.data) onSelect(person.data);
        }}>
        {search.results.map((person, index) => {
          const query = details[index];
          const canSelect =
            query.data &&
            !query.error &&
            Number.isInteger(query.data.authoredCount);
          return (
            <Box
              key={person.id}
              sx={{ borderBottom: 1, borderColor: 'divider', py: 0.5 }}>
              <FormControlLabel
                value={String(person.id)}
                disabled={!canSelect}
                control={<Radio />}
                label={
                  <Stack>
                    <DocumentAuthorLabel author={person} />
                    <Typography variant="body2">
                      #{person.id} ·{' '}
                      {formatMessage(
                        { id: 'organizationConversion.authorCount' },
                        { count: canSelect ? query.data.authoredCount : '…' }
                      )}
                    </Typography>
                  </Stack>
                }
                sx={{ width: '100%', alignItems: 'flex-start', mx: 0 }}
              />
              <CleanupError error={query.error} />
            </Box>
          );
        })}
      </RadioGroup>
      <Button
        variant="outlined"
        disabled={!search.hasSearched || search.hasError || search.isLoading}
        onClick={() => setShowCreation(open => !open)}
        data-testid="conversion-new-author">
        {formatMessage({ id: 'organizationConversion.newAuthor' })}
      </Button>
      {COMMON_AUTHORS.map(({ id, label }) => (
        <Button
          key={id}
          variant={sameId(selected?.id, id) ? 'contained' : 'outlined'}
          aria-pressed={sameId(selected?.id, id)}
          startIcon={
            sameId(selected?.id, id) ? <CheckCircleOutlinedIcon /> : undefined
          }
          loading={loadingAuthorId === id}
          disabled={!isOnline || loadingAuthorId !== null}
          onClick={() => handleCommonAuthor(id)}
          data-testid={`conversion-author-${id}`}>
          {formatMessage({ id: label })}
        </Button>
      ))}
      <CleanupError error={shortcutError} />
      {showCreation && (
        <CreateAuthor
          initialName={search.inputValue.trim() || name}
          onSelect={onCreated}
          onBusyChange={onBusyChange}
        />
      )}
    </Stack>
  );
};

AuthorChoice.propTypes = {
  name: PropTypes.string.isRequired,
  selected: personShape,
  onSelect: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
  onBusyChange: PropTypes.func.isRequired
};

export default AuthorChoice;
