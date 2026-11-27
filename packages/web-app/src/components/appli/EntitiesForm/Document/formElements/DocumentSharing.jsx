import { useContext, useEffect, useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
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
import DocumentFieldError from '../DocumentFieldError';
import { DocumentFormContext } from '../Provider';
import AuthorizationGrantedLicense from './AuthorizationGrantedLicense';
import DocumentLicenseSelect from './DocumentLicenseSelect';
import PublicationAuthorization from './PublicationAuthorization';
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
    invalidField,
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
  const showChoices = !ownWork && !hasStoredAuthorization;
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

  const sharingHelp = (
    <Link
      component="button"
      type="button"
      variant="body2"
      aria-expanded={showHelp}
      aria-controls={showHelp ? helpId : undefined}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        minHeight: { xs: 44, sm: 32 },
        textAlign: 'start'
      }}
      onClick={() => setShowHelp(value => !value)}>
      <HelpOutlineIcon fontSize="small" />
      {formatMessage({ id: 'documentForm.sharingHelp' })}
    </Link>
  );
  const sharingHelpContent = showHelp && (
    <Alert id={helpId} severity="info">
      {formatMessage({ id: 'documentForm.unknownRights' })}
    </Alert>
  );

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
    <Stack spacing={1.25} data-document-field="sharing">
      {!isNewDocument && document.files.some(file => file.state === IS_NEW) && (
        <Alert severity="info">
          {formatMessage({ id: 'documentForm.newFileSharing' })}
        </Alert>
      )}
      {showChoices && isNewDocument && (
        <FormControl
          required
          disabled={disabled}
          error={invalidField === 'sharing'}>
          <Stack
            direction="row"
            useFlexGap
            spacing={{ xs: 0, sm: 2 }}
            sx={{
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', sm: 'space-between' }
            }}>
            <FormLabel component="span" id={groupId} sx={{ fontWeight: 600 }}>
              {formatMessage({ id: 'documentForm.sharingQuestion' })}
            </FormLabel>
            {sharingHelp}
          </Stack>
          {sharingHelpContent}
          <RadioGroup
            aria-labelledby={groupId}
            aria-invalid={invalidField === 'sharing' || undefined}
            aria-describedby={
              invalidField === 'sharing' ? `${groupId}-error` : undefined
            }
            aria-required="true"
            value={option ?? ''}
            sx={{ gap: 0.5, mt: 0.5 }}
            onChange={event => selectOption(event.target.value)}>
            {thirdPartyChoices.map(([value, label, testId]) => (
              <FormControlLabel
                key={value}
                value={value}
                control={
                  <Radio
                    size="small"
                    sx={{ minWidth: 44, minHeight: 44 }}
                    slotProps={{ input: { 'data-testid': testId } }}
                  />
                }
                sx={{
                  mx: 0,
                  pr: 1,
                  borderRadius: 1,
                  bgcolor: option === value ? 'action.selected' : undefined
                }}
                label={formatMessage({ id: label })}
              />
            ))}
          </RadioGroup>
          <DocumentFieldError
            field="sharing"
            id={`${groupId}-error`}
            message="documentForm.missingSharing"
          />
        </FormControl>
      )}
      {!isNewDocument && showChoices && (
        <Stack spacing={0.5} sx={{ alignItems: 'flex-start' }}>
          {sharingHelp}
          {sharingHelpContent}
        </Stack>
      )}
      {!isNewDocument && !hasStoredAuthorization && (
        <TextField
          select
          fullWidth
          required
          error={invalidField === 'sharing'}
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
            <MenuItem key={value} value={value} data-testid={testId}>
              {formatMessage({ id: label })}
            </MenuItem>
          ))}
        </TextField>
      )}
      {(hasAuthorization || hasStoredAuthorization) && (
        <PublicationAuthorization disabled={disabled} />
      )}
      {!hasAuthorization &&
        !hasStoredAuthorization &&
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
