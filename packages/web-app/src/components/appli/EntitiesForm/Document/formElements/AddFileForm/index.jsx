import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useUserProperties } from '../../../../../../hooks';
import { isEmpty, remove } from 'ramda';
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField
} from '@mui/material';

import ErrorsList from './ErrorsList';
import { useFileFormats } from '../../../../../../hooks';
import {
  IS_DELETED,
  IS_NEW,
  AUTHORIZATION_FROM_AUTHOR,
  LICENSE_IN_FILE,
  DOCUMENT_AUTHORIZE_TO_PUBLISH,
  validateAndBuildFileEntries
} from './FileHelpers';
import FileSelectorInput from '../../../../../common/FileSelectorInput';
import { fetchLicense } from '../../../../../../actions/Licenses';
import { getDocuments } from '../../../../../../actions/Document/GetDocuments';
import { DocumentFormContext } from '../../Provider';

const DEFAULT_LICENSE = 'CC-BY-SA';

const AuthDocSelect = ({ value, onChange, disabled = false }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { data, isLoading } = useSelector(state => state.documents);
  const authDocs = data.authorizationDocuments ?? [];

  useEffect(() => {
    if (authDocs.length > 0 || isLoading) return;
    dispatch(
      getDocuments({
        isValidated: true,
        documentType: 'Authorization To Publish'
      })
    );
  }, [dispatch, authDocs.length, isLoading]);

  return (
    <Autocomplete
      disabled={disabled}
      loading={isLoading}
      options={authDocs}
      getOptionLabel={doc => doc.title ?? ''}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      value={value ?? null}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={params => (
        <TextField
          {...params}
          variant="filled"
          required={!disabled}
          label={formatMessage({ id: 'Authorization from authors' })}
          sx={{ mt: 1.5 }}
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
  );
};

AuthDocSelect.propTypes = {
  disabled: PropTypes.bool,
  value: PropTypes.shape({ id: PropTypes.number, title: PropTypes.string }),
  onChange: PropTypes.func.isRequired
};

const AddFileForm = ({
  files,
  setFiles,
  option,
  setOption,
  setLicense,
  setAuthorizationDocument,
  acceptConfig = null,
  showAuthorization = true
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const [errors, setErrors] = useState([]);
  const {
    mimeTypes,
    extensions: backendExtensions,
    loading
  } = useFileFormats();
  const { data: licenses, loading: licensesLoading } = useSelector(
    state => state.licenses
  );
  const currentUser = useUserProperties();
  const { document, updateAttribute } = useContext(DocumentFormContext);

  const isParentAuthForced =
    document.parent !== null && document.authorizationDocument !== null;
  const isLicenseForced = isParentAuthForced;
  const isAuthForced = isParentAuthForced;

  const prevParentIdRef = useRef(document.parent?.id ?? null);
  useEffect(() => {
    const currentParentId = document.parent?.id ?? null;
    if (prevParentIdRef.current === currentParentId) return;
    prevParentIdRef.current = currentParentId;
    updateAttribute('authorizationDocument', null);
  }, [document.parent, updateAttribute]);
  const accept = acceptConfig?.mime ?? mimeTypes.toString();
  const extensions =
    acceptConfig?.extensions ??
    backendExtensions.filter(e => e !== null).map(e => e.trim());
  const showAuthDocSelect = option === DOCUMENT_AUTHORIZE_TO_PUBLISH;
  const visibleFiles = files.filter(f => f.state !== IS_DELETED);

  useEffect(() => {
    if (showAuthorization && !licenses && !licensesLoading)
      dispatch(fetchLicense());
  }, [dispatch, showAuthorization, licenses, licensesLoading]);

  const documentLicenseName = document.license?.name;
  useEffect(() => {
    if (!showAuthorization || !licenses) return;
    const licenseName = documentLicenseName ?? DEFAULT_LICENSE;
    const selected = licenses.find(l => l.name === licenseName);
    if (selected) setLicense(selected);
    // setLicense is an inline arrow function prop — excluding it from deps is intentional
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAuthorization, licenses, documentLicenseName]);

  const updateOption = newOption => {
    setOption(newOption);
    setAuthorizationDocument(null);


    if (!currentUser.id) return;
    const authorsIsOnlyMe =
      document.authors.length === 1 &&
      document.authors[0].id === currentUser.id;

    // When switching to AUTHORIZE_TO_PUBLISH, remove the author only if it is
    // solely the current user — a solo pre-fill that has no real meaning on an
    // authorization form. Co-authors added manually are intentional and kept.
    if (newOption === DOCUMENT_AUTHORIZE_TO_PUBLISH) {
      if (authorsIsOnlyMe) updateAttribute('authors', []);
    } else if (document.authors.length === 0) {
      updateAttribute('authors', [
        { id: currentUser.id, nickname: currentUser.nickname }
      ]);
    }
  };

  const updateFiles = newFiles => {
    const { entries, errors: errorsList } = validateAndBuildFileEntries(
      newFiles,
      files,
      formatMessage
    );
    setErrors(isEmpty(errorsList) ? [] : errorsList);
    setFiles([...files, ...entries]);
  };

  const removeFile = fileName => {
    const index = files.findIndex(f => f.fileName === fileName);
    if (index === -1) return;
    const newFiles = [...files];
    const target = newFiles[index];
    if (target.state === IS_NEW) {
      setFiles(remove(index, 1, newFiles));
    } else {
      target.previousState = target.state;
      target.state = IS_DELETED;
      setFiles(newFiles);
    }
  };

  return (
    <>
      <FileSelectorInput
        files={visibleFiles}
        onFilesAdd={updateFiles}
        onFileRemove={removeFile}
        accept={accept}
        extensions={extensions}
        disabled={loading}
      />
      {showAuthorization && visibleFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <FormControl
            component="fieldset"
            required
            sx={{ display: 'block', mt: 2 }}>
            <FormLabel
              component="legend"
              sx={{ fontSize: '0.875rem', mb: 0.5 }}>
              {isAuthForced
                ? formatMessage({
                    id: 'The licensing type of the document has been deduced from the parent document'
                  })
                : formatMessage({ id: 'Licensing type' })}
            </FormLabel>
            <RadioGroup
              value={option ?? ''}
              onChange={e => updateOption(e.target.value)}>
              <FormControlLabel
                value={AUTHORIZATION_FROM_AUTHOR}
                disabled={isAuthForced}
                control={<Radio size="small" />}
                label={`${formatMessage({ id: 'I hold the publication rights for this content' })} (${formatMessage({ id: 'license CC-BY-SA applies' })})`}
              />
              <FormControlLabel
                value={LICENSE_IN_FILE}
                disabled={isAuthForced}
                control={<Radio size="small" />}
                label={formatMessage({
                  id: 'The license is written in the files'
                })}
              />
              <FormControlLabel
                value={DOCUMENT_AUTHORIZE_TO_PUBLISH}
                disabled={isAuthForced}
                control={<Radio size="small" />}
                label={formatMessage({
                  id: 'There is an authorization to publish from the author on GrottoCenter'
                })}
              />
            </RadioGroup>
          </FormControl>

          {showAuthDocSelect && (
            <AuthDocSelect
              value={document.authorizationDocument}
              onChange={setAuthorizationDocument}
              disabled={isAuthForced}
            />
          )}

          {option && option !== AUTHORIZATION_FROM_AUTHOR && (
              <FormControl
                variant="filled"
                fullWidth
                required
                disabled={isLicenseForced}
                sx={{ mt: 2 }}>
                <InputLabel>
                  {isLicenseForced
                    ? formatMessage({
                        id: 'The license of the document has been deduced from the parent document'
                      })
                    : formatMessage({ id: 'License' })}
                </InputLabel>
                <Select
                  value={document.license?.name ?? ''}
                  onChange={e =>
                    setLicense(licenses?.find(l => l.name === e.target.value))
                  }>
                  {licensesLoading && (
                    <MenuItem disabled>
                      <CircularProgress size={16} />
                    </MenuItem>
                  )}
                  {(licenses ?? [])
                    .slice()
                    .sort((a, b) => (a.name > b.name ? 1 : -1))
                    .map(l => (
                      <MenuItem key={l.id} value={l.name}>
                        {l.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}
        </Box>
      )}
      <ErrorsList errors={errors} />
    </>
  );
};

AddFileForm.propTypes = {
  acceptConfig: PropTypes.shape({
    extensions: PropTypes.arrayOf(PropTypes.string).isRequired,
    mime: PropTypes.string.isRequired
  }),
  files: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setFiles: PropTypes.func.isRequired,
  showAuthorization: PropTypes.bool,
  option: PropTypes.string,
  setOption: PropTypes.func,
  setLicense: PropTypes.func,
  setAuthorizationDocument: PropTypes.func
};

export default AddFileForm;
