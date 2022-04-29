import {
  FormControl as MuiFormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@material-ui/core';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import CaveSelection from './CaveSelection';
import CaveCreation from './CaveCreation';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from '../caveType';
import PolygonMap from '../../Massif/PolygonMap/Polygon';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const Cave = ({
  control,
  errors,
  entityType,
  updateEntityType,
  allLanguages,
  reset,
  disabled = false
}) => {
  const { formatMessage } = useIntl();

  const handleRadioChange = event => {
    updateEntityType(event.target.value);
    reset();
  };

  return (
    <div>
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend">
          {formatMessage({ id: 'The cave is:' })}
        </FormLabel>
        <PolygonMap />
        <RadioGroup
          aria-label="entityType"
          name="entityType"
          value={entityType}
          onChange={handleRadioChange}>
          <FormControlLabel
            value={ENTRANCE_ONLY}
            control={<Radio />}
            label={formatMessage({
              id: 'Linked to an existing cave or network'
            })}
          />
          <FormControlLabel
            value={ENTRANCE_AND_CAVE}
            control={<Radio />}
            label={formatMessage({
              id: 'First entrance of the cave (on Grottocenter)'
            })}
          />
        </RadioGroup>
      </FormControl>
      {entityType === ENTRANCE_AND_CAVE ? (
        <CaveCreation
          control={control}
          errors={errors}
          allLanguages={allLanguages}
        />
      ) : (
        <CaveSelection control={control} errors={errors} disabled={disabled} />
      )}
    </div>
  );
};
Cave.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  control: PropTypes.shape({}),
  entityType: PropTypes.oneOf([ENTRANCE_ONLY, ENTRANCE_AND_CAVE]),
  disabled: PropTypes.bool,
  errors: PropTypes.shape({}),
  reset: PropTypes.func,
  updateEntityType: PropTypes.func
};

export default Cave;
