import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Autocomplete,
  Box,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import AddCircle from '@mui/icons-material/AddCircle';
import Cancel from '@mui/icons-material/Cancel';
import CustomIcon from '@/components/common/CustomIcon';
import { entityOptionForSelector } from '@/helpers/Entity';
import { useEntitySearch, useUserProperties } from '@/hooks';
import { DocumentFormContext } from '@/components/appli/EntitiesForm/Document/Provider';
import CreateCaverPanel from '@/components/common/AuthorsSelect/CreateCaverPanel';
import CreateNewOrganization from '../OrganizationAutoComplete/CreateNewOrganization';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from '../AddFileForm/FileHelpers';

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

const MIN_SEARCH_LENGTH = 3;
const MIXED_ENTITIES = ['persons', 'organizations'];

const getOptionLabel = option =>
  (option._type === 'organizations' ? option.name : option.nickname) || '';

const getPersonIconType = option => {
  if (option._type === 'organizations') return 'organization';
  return option.type === 'AUTHOR' ? 'author' : 'caver';
};

const stripType = ({ _type, ...rest }) => rest;

const AuthorsSection = () => {
  const { formatMessage } = useIntl();
  const { document: doc, updateAttribute } = useContext(DocumentFormContext);
  const currentUser = useUserProperties();
  const hasPrefilledRef = useRef(false);

  useEffect(() => {
    if (
      hasPrefilledRef.current ||
      !currentUser.id ||
      doc.authors.length > 0 ||
      doc.selectOptionAuthorizationDocument === DOCUMENT_AUTHORIZE_TO_PUBLISH
    )
      return;
    hasPrefilledRef.current = true;
    updateAttribute('authors', [
      { id: currentUser.id, nickname: currentUser.nickname }
    ]);
    // doc.authors and updateAttribute are stable; currentUser.id guards async hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, doc.selectOptionAuthorizationDocument]);

  const value = useMemo(
    () => [
      ...doc.authors.map(a => ({ ...a, _type: 'persons' })),
      ...doc.authorsGrotto.map(o => ({ ...o, _type: 'organizations' }))
    ],
    [doc.authors, doc.authorsGrotto]
  );

  const { inputValue, setInputValue, results, isLoading, hasError } =
    useEntitySearch(MIXED_ENTITIES, { minChars: MIN_SEARCH_LENGTH });

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState('person');
  const [sideActionEnabled, setSideActionEnabled] = useState(false);

  useEffect(() => {
    if (isLoading) setSideActionEnabled(true);
  }, [isLoading]);

  const applyValue = newValue => {
    updateAttribute(
      'authors',
      newValue.filter(v => v._type === 'persons').map(stripType)
    );
    updateAttribute(
      'authorsGrotto',
      newValue.filter(v => v._type === 'organizations').map(stripType)
    );
  };

  const handleChange = (_event, newValue) => applyValue(newValue);

  const handleInputChange = (_event, newValue, reason) => {
    setInputValue(reason === 'reset' || reason === 'clear' ? '' : newValue);
  };

  const handleToggleCreate = () => setCreateOpen(prev => !prev);

  const handleCreateModeChange = (_event, newMode) => {
    if (newMode) setCreateMode(newMode);
  };

  const handleCaverCreated = caver => {
    applyValue([...value, { ...caver, _type: 'persons' }]);
    setCreateOpen(false);
  };

  const handleOrganizationCreated = organization => {
    applyValue([...value, { ...organization, _type: 'organizations' }]);
    setCreateOpen(false);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        sx={{ mb: 0.5 }}
      >
        {formatMessage({
          id: 'AuthorsSection.helperText',
          defaultMessage:
            'Choose one or more persons or organizations as authors. If the one you are looking for does not exist yet, use the + button to create it.'
        })}
      </Typography>
      <Wrapper>
        <InputWrapper>
          <Autocomplete
            multiple
            value={value}
            options={results}
            onChange={handleChange}
            onInputChange={handleInputChange}
            inputValue={inputValue}
            loading={isLoading}
            getOptionLabel={getOptionLabel}
            renderOption={(props, option) =>
              entityOptionForSelector(props, option)
            }
            isOptionEqualToValue={(option, val) =>
              option.id === val.id && option._type === val._type
            }
            filterSelectedOptions
            filterOptions={options => options}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={`${option._type}-${option.id}`}
                  color="primary"
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CustomIcon
                        type={getPersonIconType(option)}
                        size={18}
                      />
                      {getOptionLabel(option)}
                    </Box>
                  }
                />
              ))
            }
            noOptionsText={
              inputValue.length >= MIN_SEARCH_LENGTH
                ? formatMessage({
                    id: 'AuthorsSection.noOptions',
                    defaultMessage:
                      'No author matches your search (type at least 3 characters)'
                  })
                : formatMessage(
                    {
                      id: 'Type at least {nbOfChars} character(s)',
                      defaultMessage: 'Type at least {nbOfChars} character(s)'
                    },
                    { nbOfChars: MIN_SEARCH_LENGTH }
                  )
            }
            renderInput={params => (
              <TextField
                {...params}
                variant="filled"
                label={formatMessage({ id: 'Authors' })}
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
          <Collapse in={isCreateOpen} sx={{ p: 1 }}>
            <ToggleButtonGroup
              value={createMode}
              exclusive
              onChange={handleCreateModeChange}
              size="small"
              aria-label={formatMessage({
                id: 'AuthorsSection.createEntityType',
                defaultMessage: 'Type to create'
              })}
              sx={{ display: 'flex', width: '100%', mb: 1 }}
            >
              <ToggleButton value="person" sx={{ flex: 1, gap: 0.5 }}>
                <CustomIcon type="caver" size={20} />
                {formatMessage({ id: 'Person' })}
              </ToggleButton>
              <ToggleButton value="organization" sx={{ flex: 1, gap: 0.5 }}>
                <CustomIcon type="organization" size={20} />
                {formatMessage({ id: 'Organization' })}
              </ToggleButton>
            </ToggleButtonGroup>
            {createMode === 'person' ? (
              <CreateCaverPanel
                enabled={isCreateOpen}
                onCreateSuccess={handleCaverCreated}
                defaultName=""
                defaultSurname={inputValue.trim()}
              />
            ) : (
              <CreateNewOrganization
                enabled={isCreateOpen}
                onCreateSuccess={handleOrganizationCreated}
                defaultValue={inputValue.trim()}
              />
            )}
          </Collapse>
        </InputWrapper>
        <IconButton
          size="small"
          onClick={handleToggleCreate}
          disabled={!sideActionEnabled}
          color="secondary"
          aria-label={formatMessage({ id: 'new entity' })}
        >
          {isCreateOpen ? (
            <Cancel fontSize="large" />
          ) : (
            <AddCircle fontSize="large" />
          )}
        </IconButton>
      </Wrapper>
    </Box>
  );
};

export default AuthorsSection;
