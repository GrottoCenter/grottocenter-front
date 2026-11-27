import { useContext, useLayoutEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Divider, Stack, Typography } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { useIntl } from 'react-intl';
import IconLabel from '@/components/common/IconLabel';
import { DocumentFormContext } from '../Provider';
import AuthorizationDocumentSelect from './AuthorizationDocumentSelect';
import AuthorizationGrantedLicense from './AuthorizationGrantedLicense';

const PublicationAuthorization = ({ disabled = false, required = true }) => {
  const { formatMessage } = useIntl();
  const { document, hasStoredAuthorization, invalidField, updateAttribute } =
    useContext(DocumentFormContext);
  const [isReplacing, setIsReplacing] = useState(false);
  const search = useRef(null);
  const replaceButton = useRef(null);
  const restoreFocus = useRef(false);
  const authorization = document.authorizationDocument;
  const hasSelection = !!authorization?.id;
  const showSearch = !hasSelection || isReplacing;

  useLayoutEffect(() => {
    if (showSearch && isReplacing) search.current?.focus();
    if (!showSearch && restoreFocus.current) {
      restoreFocus.current = false;
      replaceButton.current?.focus({ preventScroll: true });
    }
  }, [showSearch, isReplacing]);

  const closeSearch = () => {
    restoreFocus.current = true;
    setIsReplacing(false);
  };

  return (
    <Stack
      spacing={1.25}
      data-document-field="authorization"
      sx={{
        bgcolor: 'background.default',
        borderRadius: 1,
        p: { xs: 1.5, sm: 2 }
      }}>
      {showSearch ? (
        <>
          <AuthorizationDocumentSelect
            inputRef={search}
            value={authorization}
            onChange={value => {
              updateAttribute('authorizationDocument', value);
              if (value) closeSearch();
            }}
            required={required || hasStoredAuthorization}
            showRequiredError={
              invalidField === 'authorization' && !hasSelection
            }
            disableClearable={hasStoredAuthorization}
            disabled={disabled}
          />
          {isReplacing && hasSelection && (
            <Button
              type="button"
              size="small"
              variant="text"
              onClick={closeSearch}
              sx={{
                alignSelf: 'flex-start',
                textTransform: 'none',
                minHeight: { xs: 44, sm: 32 }
              }}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
          )}
        </>
      ) : (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={0.5}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' }
          }}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {formatMessage({ id: 'Authorization To Publish' })}
            </Typography>
            <IconLabel
              icon={
                <GavelIcon
                  color="primary"
                  fontSize="small"
                  data-testid="authorization-type-icon"
                />
              }
              alignToFirstLine>
              <Typography
                component="span"
                variant="body2"
                fontWeight={600}
                sx={{ overflowWrap: 'anywhere' }}>
                {authorization.title ||
                  formatMessage({ id: 'Authorization To Publish' })}
              </Typography>
            </IconLabel>
          </Stack>
          <Stack
            direction="row"
            useFlexGap
            spacing={0.25}
            sx={{ flexWrap: 'wrap' }}>
            <Button
              ref={replaceButton}
              type="button"
              size="small"
              variant="text"
              disabled={disabled}
              onClick={() => setIsReplacing(true)}
              sx={{ textTransform: 'none', minHeight: { xs: 44, sm: 32 } }}>
              {formatMessage({ id: 'documentForm.replaceAuthorization' })}
            </Button>
            {!hasStoredAuthorization && (
              <Button
                type="button"
                size="small"
                variant="text"
                disabled={disabled}
                onClick={() => {
                  updateAttribute('authorizationDocument', null);
                  setIsReplacing(true);
                }}
                sx={{ textTransform: 'none', minHeight: { xs: 44, sm: 32 } }}>
                {formatMessage({ id: 'Remove' })}
              </Button>
            )}
          </Stack>
        </Stack>
      )}
      {hasSelection && (
        <>
          <Divider />
          <AuthorizationGrantedLicense />
        </>
      )}
    </Stack>
  );
};

PublicationAuthorization.propTypes = {
  disabled: PropTypes.bool,
  required: PropTypes.bool
};

export default PublicationAuthorization;
