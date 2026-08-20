import { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl, FormattedMessage } from 'react-intl';
import { isEmpty, remove } from 'ramda';
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField
} from '@mui/material';

import LicenseTag from '@/components/common/LicenseTag';
import AppLink from '@/components/common/AppLink';
import InternationalizedLink from '@/components/common/InternationalizedLink';
import { licenceLinks } from '@/conf/externalLinks';
import {
  useUserProperties,
  useFileFormats,
  useLicenses,
  useDocuments,
  findLicenseByName
} from '../../../../../../hooks';
import ErrorsList from './ErrorsList';
import {
  IS_DELETED,
  IS_NEW,
  AUTHORIZATION_FROM_AUTHOR,
  LICENSE_IN_FILE,
  DOCUMENT_AUTHORIZE_TO_PUBLISH,
  validateAndBuildFileEntries
} from './FileHelpers';
import FileSelectorInput from '../../../../../common/FileSelectorInput';
import { DocumentFormContext } from '../../Provider';

const DEFAULT_LICENSE = 'CC-BY-SA';

const AuthDocSelect = ({ value, onChange, disabled = false }) => {
  const { formatMessage } = useIntl();
  const { data, isLoading } = useDocuments({
    isValidated: true,
    documentType: 'Authorization To Publish'
  });
  const authDocs = data?.documents ?? [];

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
  const [errors, setErrors] = useState([]);
  const {
    mimeTypes,
    extensions: backendExtensions,
    isLoading
  } = useFileFormats();
  // Fetched only where the authorization block is shown; React Query keeps the
  // call site unconditional and skips the request until then.
  const { data: licenses, isLoading: licensesLoading } = useLicenses({
    enabled: showAuthorization
  });
  const currentUser = useUserProperties();
  const { document, updateAttribute } = useContext(DocumentFormContext);

  const parentId = document.parent?.id ?? null;
  const prevParentIdRef = useRef(parentId);
  useEffect(() => {
    if (prevParentIdRef.current === parentId) return;
    prevParentIdRef.current = parentId;
    updateAttribute('authorizationDocument', null);
  }, [parentId, updateAttribute]);

  const isParentAuthForced =
    document.parent !== null && document.authorizationDocument !== null;
  const isLicenseForced = isParentAuthForced;
  const isAuthForced = isParentAuthForced;

  const extensions =
    acceptConfig?.extensions ??
    backendExtensions.filter(e => e !== null).map(e => e.trim());
  // Build the accept attribute from both MIME types and file extensions. Some
  // supported formats have MIME types the browser cannot resolve to a picker
  // filter (e.g. application/gpx+xml, or the application/octet-stream Therion
  // formats th/th2/thconfig/lox/xvi…), so listing the extensions explicitly is
  // what actually makes those files selectable.
  const dottedExtensions = extensions.map(e => `.${e}`);
  const accept = [
    acceptConfig?.mime ?? mimeTypes.toString(),
    ...dottedExtensions
  ]
    .filter(Boolean)
    .join(',');
  const showAuthDocSelect = option === DOCUMENT_AUTHORIZE_TO_PUBLISH;
  const visibleFiles = files.filter(f => f.state !== IS_DELETED);

  const documentLicenseName = document.license?.name;
  useEffect(() => {
    if (!showAuthorization || !licenses) return;
    const licenseName = documentLicenseName ?? DEFAULT_LICENSE;
    const selected = findLicenseByName(licenses, licenseName);
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
        disabled={isLoading}
      />
      {showAuthorization && visibleFiles.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <FormControl
            component="fieldset"
            required
            sx={{ display: 'block', mt: 1 }}>
            <FormLabel
              component="legend"
              sx={{
                fontSize: '0.875rem'
              }}>
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
                label={
                  <>
                    {formatMessage({
                      id: 'I hold the publication rights for this content'
                    })}
                    {' ('}
                    <FormattedMessage
                      id="license {license} applies"
                      values={{
                        license: (
                          <InternationalizedLink links={licenceLinks}>
                            CC-BY-SA
                          </InternationalizedLink>
                        )
                      }}
                    />
                    )
                  </>
                }
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
                  id: 'There is an authorization to publish from the author on Grottocenter'
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
            <>
              <FormControl
                variant="filled"
                fullWidth
                required
                disabled={isLicenseForced}
                sx={{ mt: 1 }}>
                <InputLabel>
                  {isLicenseForced
                    ? formatMessage({
                        id: 'The license of the document has been deduced from the parent document'
                      })
                    : formatMessage({ id: 'License' })}
                </InputLabel>
                <Select
                  value={document.license?.name ?? ''}
                  renderValue={() => <LicenseTag license={document.license} />}
                  onChange={e =>
                    setLicense(findLicenseByName(licenses, e.target.value))
                  }>
                  {licensesLoading && (
                    <MenuItem disabled>
                      <CircularProgress size={16} />
                    </MenuItem>
                  )}
                  {(licenses ?? []).map(l => (
                    <MenuItem key={l.id} value={l.name}>
                      <LicenseTag
                        license={l}
                        recommended={l.name === DEFAULT_LICENSE}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {document.license?.url && (
                <Link
                  component={AppLink}
                  href={document.license.url}
                  variant="caption"
                  color="primary"
                  sx={{ display: 'inline-block', mt: 0.5 }}>
                  {formatMessage({ id: 'See the full license' })}
                </Link>
              )}
            </>
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
