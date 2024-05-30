import {
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  FormControl
} from '@mui/material';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { fetchLicense } from '../../../actions/Licenses';

const Wrapper = styled(FormControl)`
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
    <Wrapper variant="filled">
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
    </Wrapper>
  );
};

export default LicenseSelect;

LicenseSelect.propTypes = {
  label: PropTypes.string,
  selected: PropTypes.oneOf([PropTypes.string, PropTypes.number]),
  updateSelected: PropTypes.func.isRequired
};
