import { useId } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  CircularProgress,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';

import LicenseTag from '@/components/common/LicenseTag';
import {
  DEFAULT_DOCUMENT_LICENSE,
  getLicenseName
} from '@/components/common/LicenseTag/helpers';
import FieldHelperText from '@/components/common/Form/FieldHelperText';
import { findLicenseByName } from '@/hooks';
import DocumentLicenseDeedLink from './DocumentLicenseDeedLink';

const DocumentLicenseSelect = ({
  value,
  onChange,
  licenses = [],
  isLoading = false,
  disabled = false,
  label = 'License',
  description,
  hasUnknownLicense = false
}) => {
  const { formatMessage } = useIntl();
  const id = useId();
  const licenseName = getLicenseName(value);
  const describedBy =
    [description && `${id}-description`, hasUnknownLicense && `${id}-error`]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <>
      {description && (
        <FieldHelperText id={`${id}-description`}>
          {description}
        </FieldHelperText>
      )}
      <FormControl
        variant="filled"
        fullWidth
        required
        error={hasUnknownLicense}
        disabled={disabled}
        sx={{ mt: description ? 0 : 1 }}>
        <InputLabel id={`${id}-label`}>
          {formatMessage({ id: label })}
        </InputLabel>
        <Select
          labelId={`${id}-label`}
          data-testid="document-license"
          inputProps={{ 'aria-describedby': describedBy }}
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
          <FormHelperText id={`${id}-error`}>
            {formatMessage({ id: 'Select a license' })}
          </FormHelperText>
        )}
      </FormControl>
      {value?.url && <DocumentLicenseDeedLink url={value.url} />}
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
  label: PropTypes.string,
  description: PropTypes.string,
  hasUnknownLicense: PropTypes.bool
};

export default DocumentLicenseSelect;
