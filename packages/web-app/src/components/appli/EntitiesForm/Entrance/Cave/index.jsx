import {
  FormControl as MuiFormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Button,
  Radio
} from '@material-ui/core';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

import CaveSelection from './CaveSelection';
import CaveCreation from './CaveCreation';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from '../caveType';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const Cave = ({
  allowMoveFromCave,
  control,
  errors,
  entityType,
  entranceId,
  updateEntityType,
  allLanguages,
  reset,
  disabled = false
}) => {
  const { formatMessage } = useIntl();
  const history = useHistory();

  const handleRadioChange = event => {
    updateEntityType(event.target.value);
    reset();
  };

  const handleLinkToExistingCaveClick = () => {
    history.push(`/ui/entrances/${entranceId}/move`);
  };

  const canMoveEntranceToExistingCave = allowMoveFromCave && entranceId;

  return (
    <div>
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend">
          {formatMessage({ id: 'The cave is:' })}
        </FormLabel>
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
        {canMoveEntranceToExistingCave && (
          <Button onClick={handleLinkToExistingCaveClick} color="secondary">
            {formatMessage({
              id: 'Link to an existing cave or network'
            })}
          </Button>
        )}
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
  allowMoveFromCave: PropTypes.bool.isRequired,
  control: PropTypes.shape({}),
  entityType: PropTypes.oneOf([ENTRANCE_ONLY, ENTRANCE_AND_CAVE]),
  entranceId: PropTypes.number,
  disabled: PropTypes.bool,
  errors: PropTypes.shape({}),
  reset: PropTypes.func,
  updateEntityType: PropTypes.func
};

export default Cave;
