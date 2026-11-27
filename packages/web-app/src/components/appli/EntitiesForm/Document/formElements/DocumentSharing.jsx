import { useContext, useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Alert,
  FormControl,
  FormControlLabel,
  FormLabel,
  Link,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import {
  DEFAULT_DOCUMENT_LICENSE,
  getLicenseName
} from '@/components/common/LicenseTag/helpers';
import { useLicenses, findLicenseByName } from '@/hooks';
import { DocumentFormContext } from '../Provider';
import AuthorizationDocumentSelect from './AuthorizationDocumentSelect';
import AuthorizationGrantedLicense from './AuthorizationGrantedLicense';
import DocumentLicenseSelect from './DocumentLicenseSelect';
import {
  AUTHORIZATION_FROM_AUTHOR,
  DOCUMENT_AUTHORIZE_TO_PUBLISH,
  LICENSE_IN_FILE,
  IS_NEW,
  IS_DELETED
} from './AddFileForm/FileHelpers';

const thirdPartyChoices = [
  [
    LICENSE_IN_FILE,
    'The license is written in the files',
    'publication-license-in-file'
  ],
  [
    DOCUMENT_AUTHORIZE_TO_PUBLISH,
    'documentForm.recordedPermission',
    'publication-authorization'
  ]
];

const editChoices = [
  [
    AUTHORIZATION_FROM_AUTHOR,
    'documentForm.publishedByAuthor',
    'publication-author-rights'
  ],
  ...thirdPartyChoices
];

const DocumentSharing = ({ ownWork = false, disabled = false }) => {
  const { formatMessage } = useIntl();
  const {
    document,
    isNewDocument,
    hasStoredAuthorization,
    grantedPublicationLicense,
    updateAttribute
  } = useContext(DocumentFormContext);
  const [showHelp, setShowHelp] = useState(false);
  const groupId = useId();
  const helpId = useId();
  const option = document.selectOptionAuthorizationDocument;
  const inherited =
    document.inheritedPublicationRights &&
    (grantedPublicationLicense?.license ||
      grantedPublicationLicense?.isLoading);
  const isRightsHolder = option === AUTHORIZATION_FROM_AUTHOR;
  const hasAuthorization = option === DOCUMENT_AUTHORIZE_TO_PUBLISH;
  const {
    data: licenses,
    isLoading,
    isError
  } = useLicenses({
    enabled: !hasAuthorization
  });
  const hasValidOption = editChoices.some(([value]) => value === option);
  const isOwnWork = isNewDocument && ownWork && !hasAuthorization;
  const licenseName = getLicenseName(document.license);
  const resolvedLicense = findLicenseByName(licenses, licenseName);
  const defaultLicense = findLicenseByName(licenses, DEFAULT_DOCUMENT_LICENSE);
  const unknownLicense = !!licenses && !!licenseName && !resolvedLicense;

  useEffect(() => {
    if (hasAuthorization || document.isParentPending) return;
    if (isNewDocument && !isOwnWork && isRightsHolder) {
      updateAttribute('selectOptionAuthorizationDocument', null);
      updateAttribute('license', null);
      return;
    }
    if (isOwnWork && !isRightsHolder) {
      updateAttribute(
        'selectOptionAuthorizationDocument',
        AUTHORIZATION_FROM_AUTHOR
      );
    }
    const selected =
      resolvedLicense ?? (isOwnWork && !licenseName ? defaultLicense : null);
    if (selected && selected.id !== document.license?.id) {
      updateAttribute('license', selected);
    }
  }, [
    defaultLicense,
    document.isParentPending,
    document.license?.id,
    hasAuthorization,
    isNewDocument,
    isOwnWork,
    isRightsHolder,
    licenseName,
    resolvedLicense,
    updateAttribute
  ]);

  const selectOption = value => {
    updateAttribute('selectOptionAuthorizationDocument', value || null);
    updateAttribute('authorizationDocument', null);
    updateAttribute(
      'license',
      value === AUTHORIZATION_FROM_AUTHOR
        ? (defaultLicense ?? DEFAULT_DOCUMENT_LICENSE)
        : null
    );
  };

  if (inherited) {
    return (
      <Alert severity="info" data-testid="document-inherited-sharing">
        <Stack spacing={0.5}>
          <Typography variant="body2">
            {formatMessage(
              { id: 'documentForm.inheritedSharing' },
              { parent: document.parent?.title }
            )}
          </Typography>
          <Typography variant="body2">
            {document.authorizationDocument?.title}
          </Typography>
          <AuthorizationGrantedLicense />
        </Stack>
      </Alert>
    );
  }

  return (
    <Stack spacing={1.25} sx={{ maxWidth: '42rem' }}>
      {!isNewDocument && document.files.some(file => file.state === IS_NEW) && (
        <Alert severity="info">
          {formatMessage({ id: 'documentForm.newFileSharing' })}
        </Alert>
      )}
      {hasStoredAuthorization && (
        <Typography variant="body2" color="text.secondary">
          {formatMessage({ id: 'documentForm.keepAuthorization' })}
        </Typography>
      )}
      {!ownWork && isNewDocument && (
        <FormControl component="fieldset" required disabled={disabled}>
          <FormLabel component="legend" id={groupId}>
            {formatMessage({ id: 'documentForm.sharingQuestion' })}
          </FormLabel>
          <RadioGroup
            aria-labelledby={groupId}
            value={option ?? ''}
            onChange={event => selectOption(event.target.value)}>
            {thirdPartyChoices.map(([value, label, testId]) => (
              <FormControlLabel
                key={value}
                value={value}
                control={
                  <Radio
                    size="small"
                    slotProps={{ input: { 'data-testid': testId } }}
                  />
                }
                label={formatMessage({ id: label })}
              />
            ))}
          </RadioGroup>
        </FormControl>
      )}
      {!isNewDocument && (
        <TextField
          select
          fullWidth
          required
          data-testid="document-sharing-basis"
          disabled={disabled}
          label={formatMessage({ id: 'documentForm.sharingBasis' })}
          value={hasValidOption ? option : ''}
          onChange={event => selectOption(event.target.value)}
          helperText={
            !hasValidOption &&
            formatMessage({ id: 'documentForm.missingSharing' })
          }>
          {editChoices.map(([value, label, testId]) => (
            <MenuItem
              key={value}
              value={value}
              data-testid={testId}
              disabled={
                hasStoredAuthorization &&
                value !== DOCUMENT_AUTHORIZE_TO_PUBLISH
              }>
              {formatMessage({ id: label })}
            </MenuItem>
          ))}
        </TextField>
      )}
      {!ownWork && (
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            aria-expanded={showHelp}
            aria-controls={showHelp ? helpId : undefined}
            onClick={() => setShowHelp(value => !value)}>
            {formatMessage({ id: 'documentForm.sharingHelp' })}
          </Link>
          {showHelp && (
            <Alert id={helpId} severity="info">
              {formatMessage({ id: 'documentForm.unknownRights' })}
            </Alert>
          )}
        </Stack>
      )}
      {hasAuthorization && (
        <>
          <AuthorizationDocumentSelect
            value={document.authorizationDocument}
            onChange={value => updateAttribute('authorizationDocument', value)}
            disableClearable={hasStoredAuthorization}
            disabled={disabled}
          />
          {document.authorizationDocument?.id && (
            <AuthorizationGrantedLicense />
          )}
        </>
      )}
      {!hasAuthorization &&
        (isOwnWork ||
          (hasValidOption && (!isNewDocument || !isRightsHolder))) && (
          <DocumentLicenseSelect
            value={document.license}
            onChange={value => updateAttribute('license', value)}
            licenses={licenses}
            isLoading={isLoading}
            hasUnknownLicense={
              unknownLicense || (!isNewDocument && !licenseName)
            }
            disabled={disabled}
          />
        )}
      {!ownWork &&
        document.files.filter(file => file.state !== IS_DELETED).length > 1 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ maxWidth: '70ch' }}>
            {formatMessage({ id: 'documentForm.allFiles' })}
          </Typography>
        )}
      {isError && !hasAuthorization && (
        <Alert severity="error">
          {formatMessage({ id: 'entityCreation.searchFailed' })}
        </Alert>
      )}
    </Stack>
  );
};

DocumentSharing.propTypes = {
  ownWork: PropTypes.bool,
  disabled: PropTypes.bool
};

export default DocumentSharing;
