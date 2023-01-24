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
import { useController } from 'react-hook-form';
import CaveSelection from './CaveSelect';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';

import Alert from '../../../common/Alert';
import { FormRow, FormSectionLabel } from '../utils/FormContainers';
import InputLanguage from '../utils/InputLanguage';
import InputText from '../utils/InputText';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const EditTypeSelection = ({
  control,
  errors,
  entityType,
  updateEntityType,
  allowMoveFromCave,
  entranceId,
  reset,
  disabled = false
}) => {
  const { formatMessage } = useIntl();
  const history = useHistory();

  const canMoveEntranceToExistingCave = allowMoveFromCave && entranceId;

  const {
    field: { onChange: onNameChange }
  } = useController({
    control,
    name: 'entrance.name',
    rules: { required: true }
  });

  return (
    <>
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend">
          {formatMessage({ id: 'The cave is:' })}
        </FormLabel>
        <RadioGroup
          aria-label="entityType"
          name="entityType"
          value={entityType}
          onChange={event => {
            updateEntityType(event.target.value);
            reset();
          }}>
          <FormControlLabel
            value={ENTRANCE_AND_CAVE}
            control={<Radio />}
            label={formatMessage({
              id: 'First entrance of the cave (on Grottocenter)'
            })}
          />
          <FormControlLabel
            value={ENTRANCE_ONLY}
            control={<Radio />}
            label={formatMessage({
              id: 'Linked to an existing cave or network'
            })}
          />
        </RadioGroup>
        {canMoveEntranceToExistingCave && (
          <Button
            onClick={() => {
              history.push(`/ui/entrances/${entranceId}/move`);
            }}
            color="secondary">
            {formatMessage({
              id: 'Link to an existing cave or network'
            })}
          </Button>
        )}
      </FormControl>
      {entityType === ENTRANCE_AND_CAVE ? (
        <FormRow>
          <InputText
            formKey="cave.name"
            labelName="Cave (and entrance) name"
            control={control}
            isError={!!errors?.cave?.name}
            isRequired
            onChangeAdditionalFn={onNameChange}
          />
          <InputLanguage
            formKey="cave.language"
            labelName="Cave name language"
            control={control}
            isError={!!errors?.cave?.language}
          />
        </FormRow>
      ) : (
        <>
          <CaveSelection
            control={control}
            errors={errors}
            disabled={disabled}
          />
          {errors?.caveName && (
            <Alert severity="error" content={errors.caveName} />
          )}
          <FormSectionLabel label="Basic Information" />
          <FormRow>
            <InputText
              formKey="entrance.name"
              labelName="Entrance name"
              control={control}
              isError={!!errors?.entrance?.name}
              isRequired
            />
            <InputLanguage
              formKey="entrance.language"
              labelName="Entrance name language"
              control={control}
              isError={!!errors?.entrance?.language}
            />
          </FormRow>
        </>
      )}
    </>
  );
};

EditTypeSelection.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    cave: PropTypes.shape({
      name: PropTypes.string,
      language: PropTypes.string
    }),
    entrance: PropTypes.shape({
      name: PropTypes.string,
      language: PropTypes.string
    }),
    caveName: PropTypes.string
  }),
  entityType: PropTypes.oneOf([ENTRANCE_ONLY, ENTRANCE_AND_CAVE]),
  updateEntityType: PropTypes.func,
  allowMoveFromCave: PropTypes.bool.isRequired,
  entranceId: PropTypes.number,
  disabled: PropTypes.bool,
  reset: PropTypes.func
};

export default EditTypeSelection;
