import { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Autocomplete, Box } from '@mui/material';
import FieldHelperText from '@/components/common/Form/FieldHelperText';
import EntityAutocompleteInput from '@/components/common/AutoCompleteSearch/EntityAutocompleteInput';
import { entityOptionForSelector } from '@/helpers/Entity';
import { useEntitySearch } from '@/hooks';
import {
  documentTypeHelpers,
  filterParentDocumentResults,
  getDocumentTypeIcon
} from '@/utils/documentTypeHelpers';
import { DocumentFormContext } from '../Provider';
import useParentDocumentSelection from '../useParentDocumentSelection';

const DOCUMENTS = ['documents'];
const MIN_SEARCH_LENGTH = 3;
const getDocumentName = document => document.title || '';

const ParentDocumentSelect = ({
  helperContent,
  labelText,
  required = false,
  searchLabelText
}) => {
  const { formatMessage } = useIntl();
  const { document } = useContext(DocumentFormContext);
  const value = document.parent;
  const selectDocument = useParentDocumentSelection();
  const filter = useMemo(() => {
    if (documentTypeHelpers.isArticle(document.type)) return { type: 'Issue' };
    if (documentTypeHelpers.isIssue(document.type))
      return { type: 'Collection' };
    return {};
  }, [document.type]);
  const { inputValue, setInputValue, results, isLoading, hasError } =
    useEntitySearch(DOCUMENTS, {
      filter,
      minChars: MIN_SEARCH_LENGTH,
      skipQuery: value?.title
    });
  const options =
    value && !results.some(option => String(option.id) === String(value.id))
      ? [value, ...results]
      : results;
  const TypeIcon = getDocumentTypeIcon(value?.type);
  const emptyText =
    inputValue.trim().length >= MIN_SEARCH_LENGTH
      ? formatMessage({ id: 'No results' })
      : formatMessage(
          { id: 'Type at least {nbOfChars} character(s)' },
          { nbOfChars: MIN_SEARCH_LENGTH }
        );

  return (
    <Box sx={{ width: '100%', minWidth: 0 }} data-testid="document-parent">
      {helperContent && <FieldHelperText>{helperContent}</FieldHelperText>}
      <Autocomplete
        fullWidth
        openOnFocus
        value={value}
        inputValue={inputValue}
        options={filterParentDocumentResults(options, document.id)}
        loading={isLoading}
        loadingText={formatMessage({ id: 'Loading ...' })}
        getOptionLabel={getDocumentName}
        renderOption={(props, option) =>
          entityOptionForSelector(props, { ...option, _type: 'documents' })
        }
        isOptionEqualToValue={(option, selected) =>
          String(option.id) === String(selected.id)
        }
        filterOptions={available => available}
        onInputChange={(_event, next) => setInputValue(next)}
        onChange={(_event, next) => {
          selectDocument(next);
          setInputValue(next?.title ?? '');
        }}
        noOptionsText={
          hasError
            ? formatMessage({ id: 'entityCreation.searchFailed' })
            : emptyText
        }
        slotProps={{ listbox: { sx: { p: 0 } } }}
        renderInput={params => (
          <EntityAutocompleteInput
            params={params}
            label={labelText}
            placeholder={searchLabelText}
            required={required && !value}
            hasError={hasError}
            loading={isLoading}
            testId="document-parent-search"
            selectedIcon={
              value && <TypeIcon fontSize="small" color="primary" />
            }
          />
        )}
      />
    </Box>
  );
};

ParentDocumentSelect.propTypes = {
  helperContent: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  searchLabelText: PropTypes.string.isRequired
};

export default ParentDocumentSelect;
