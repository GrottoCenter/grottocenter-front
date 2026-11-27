import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  Link,
  MenuItem,
  Select
} from '@mui/material';

import LicenseTag from '@/components/common/LicenseTag';
import {
  DEFAULT_DOCUMENT_LICENSE,
  getLicenseName
} from '@/components/common/LicenseTag/helpers';
import AppLink from '@/components/common/AppLink';
import { findLicenseByName } from '@/hooks';

const DocumentLicenseSelect = ({
  value,
  onChange,
  licenses = [],
  isLoading = false,
  disabled = false,
  isInherited = false,
  hasUnknownLicense = false
}) => {
  const { formatMessage } = useIntl();
  const licenseName = getLicenseName(value);

  return (
    <>
      <FormControl
        variant="filled"
        fullWidth
        required
        error={hasUnknownLicense}
        disabled={disabled}
        sx={{ mt: 1 }}>
        <InputLabel id="document-license-label">
          {formatMessage({
            id: isInherited
              ? 'The license of the document has been deduced from the parent document'
              : 'License'
          })}
        </InputLabel>
        <Select
          labelId="document-license-label"
          data-testid="document-license"
          inputProps={
            hasUnknownLicense
              ? { 'aria-describedby': 'document-license-help' }
              : undefined
          }
          value={licenseName}
          renderValue={() => <LicenseTag license={value} />}
          onChange={e => onChange(findLicenseByName(licenses, e.target.value))}>
          {/* Keep legacy values in range while the reference list is loading. */}
          {licenseName && !findLicenseByName(licenses, licenseName) && (
            <MenuItem disabled value={licenseName}>
              <LicenseTag license={value} />
            </MenuItem>
          )}
          {isLoading && (
            <MenuItem disabled>
              <CircularProgress size={16} />
            </MenuItem>
          )}
          {licenses.map(license => (
            <MenuItem
              key={license.id}
              value={license.name}
              data-testid={`document-license-option-${license.id}`}>
              <LicenseTag
                license={license}
                recommended={license.name === DEFAULT_DOCUMENT_LICENSE}
              />
            </MenuItem>
          ))}
        </Select>
        {hasUnknownLicense && (
          <FormHelperText id="document-license-help">
            {formatMessage({ id: 'Select a license' })}
          </FormHelperText>
        )}
      </FormControl>
      {value?.url && (
        <Link
          component={AppLink}
          href={value.url}
          variant="caption"
          color="primary"
          sx={{ display: 'inline-block', mt: 0.5 }}>
          {formatMessage({ id: 'See the full license' })}
        </Link>
      )}
    </>
  );
};

DocumentLicenseSelect.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      url: PropTypes.string
    })
  ]),
  onChange: PropTypes.func.isRequired,
  licenses: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })
  ),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  isInherited: PropTypes.bool,
  hasUnknownLicense: PropTypes.bool
};

export default DocumentLicenseSelect;
