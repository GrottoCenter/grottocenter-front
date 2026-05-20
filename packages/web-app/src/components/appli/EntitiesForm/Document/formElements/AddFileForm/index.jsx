import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, remove } from 'ramda';
import {
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
import MultipleCaversSelect from '../MultipleCaversSelect';

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

  if (disabled) {
    return (
      <TextField
        variant="filled"
        fullWidth
        disabled
        label={formatMessage({ id: 'Authorization from authors' })}
        value={value?.title ?? ''}
        sx={{ mt: 1.5 }}
      />
    );
  }

  return (
    <FormControl variant="filled" fullWidth required sx={{ mt: 1.5 }}>
      <InputLabel required>
        {formatMessage({ id: 'Authorization from authors' })}
      </InputLabel>
      <Select
        value={isLoading ? -1 : (value?.id ?? -1)}
        onChange={e => onChange(authDocs.find(d => d.id === e.target.value))}>
        <MenuItem value={-1} disabled>
          {isLoading ? (
            <CircularProgress size={16} />
          ) : (
            <i>{formatMessage({ id: 'Select an authorization document' })}</i>
          )}
        </MenuItem>
        {authDocs.map(doc => (
          <MenuItem key={doc.id} value={doc.id}>
            {doc.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
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
  const authTokenDecoded = useSelector(state => state.login.authTokenDecoded);
  const { document, updateAttribute } = useContext(DocumentFormContext);

  const isLicenseForced = document.parent !== null && document.license !== null;
  const isAuthForced =
    document.parent !== null &&
    document.selectOptionAuthorizationDocument !== null;
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

  // Fires on mount AND whenever option changes back to AUTHORIZATION_FROM_AUTHOR.
  // Co-authors added while another option was selected are intentionally reset to
  // just the logged-in user — by design, the "Author" option means a single author.
  useEffect(() => {
    if (!showAuthorization) return;
    if (option === AUTHORIZATION_FROM_AUTHOR && authTokenDecoded) {
      updateAttribute('authors', [
        { id: authTokenDecoded.id, nickname: authTokenDecoded.nickname }
      ]);
    }
  }, [option, showAuthorization, authTokenDecoded, updateAttribute]);

  const updateOption = newOption => {
    setOption(newOption);
    setAuthorizationDocument(null);
    if (newOption === LICENSE_IN_FILE) setLicense(null);
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
                label={`${formatMessage({ id: 'You are the author of this document' })} (${formatMessage({ id: 'license CC-BY-SA applies' })})`}
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

          {option && option !== AUTHORIZATION_FROM_AUTHOR && (
            <MultipleCaversSelect
              computeHasError={() => false}
              contextValueName="authors"
              helperText={formatMessage({
                id: 'Choose one or more authors among those already registered. If the author you are looking for does not exist in Grottocenter, it is possible to add him/her using the + button on the right.'
              })}
              labelName="Authors"
            />
          )}

          {showAuthDocSelect && (
            <AuthDocSelect
              value={document.authorizationDocument}
              onChange={setAuthorizationDocument}
              disabled={isAuthForced}
            />
          )}

          {option &&
            option !== LICENSE_IN_FILE &&
            option !== AUTHORIZATION_FROM_AUTHOR && (
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
