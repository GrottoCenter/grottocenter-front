import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { DocumentFormContext } from '../../../Provider';

import DocumentFormAutoComplete from '../../DocumentFormAutoComplete';
import { fetchLicense } from '../../../../../../../actions/Licenses';

const StyledFormControl = styled(FormControl)`
  ${({ theme }) => `
    margin: ${theme.spacing(4)};`}
`;

const DEFAULT_LICENSE = 'CC-BY-SA';

const LicenseSelect = ({ label, selected, updateSelected }) => {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(state => state.licenses);

  useEffect(() => {
    dispatch(fetchLicense());
  }, [dispatch]);

  /* Select uses reference comparison to check which license has been taken.
  If there is a default value, then the reference will be different from the object created when the licenses are retrieved.
  */
  useEffect(() => {
    if (data) {
      const licenseName = selected ?? DEFAULT_LICENSE;
      const selectedLicense = data.find(
        license => license.name === licenseName
      );
      if (selectedLicense) {
        updateSelected(selectedLicense);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <StyledFormControl variant="filled">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={selected?.name || ''}
        onChange={event =>
          updateSelected(data.find(e => e.name === event.target.value))
        }>
        {data &&
          data
            .sort((l1, l2) => l1.name > l2.name)
            .map(license => (
              <MenuItem key={license.id} value={license.name}>
                {license.name}
              </MenuItem>
            ))}
      </Select>
      {loading && <CircularProgress color="primary" />}
    </StyledFormControl>
  );
};

LicenseSelect.propTypes = {
  label: PropTypes.string,
  selected: PropTypes.oneOf([PropTypes.string, PropTypes.number]),
  updateSelected: PropTypes.func.isRequired
};

const LicenseSelectAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  updateSelected
}) => {
  const { document } = useContext(DocumentFormContext);

  return (
    <DocumentFormAutoComplete
      autoCompleteSearch={
        <LicenseSelect
          label={labelText}
          selected={document[contextValueName]}
          updateSelected={updateSelected}
        />
      }
      contextValueName={contextValueName}
      getValueName={license => {
        if (license && license.name) {
          return license.name;
        }
        return '';
      }}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={null} // No specific adornment needed for license selection
      sideActionDisabled={false}
      sideActionIcon={null}
      onSideAction={null}
      isSideActionOpen={null}
    />
  );
};

LicenseSelectAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.string,
  helperContentIfValueIsForced: PropTypes.string,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  updateSelected: PropTypes.func.isRequired
};

export default LicenseSelectAutoComplete;
