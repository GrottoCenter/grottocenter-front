import { Box } from '@mui/material';
import React from 'react';
import PropTypes from 'prop-types';
import { useController } from 'react-hook-form';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';

import { FormRow } from '../utils/FormContainers';
import InputLanguage from '../utils/InputLanguage';
import InputText from '../utils/InputText';
import NameSuggestionDropdown from './NameSuggestionDropdown';

const EditTypeSelection = ({
  control,
  errors,
  entityType,
  isNewEntrance = false
}) => {
  // Only used to mirror the cave name into the (hidden) entrance name field in
  // ENTRANCE_AND_CAVE mode, where the entrance takes the cave's name. No
  // `required` rule here on purpose: that field is hidden and derived in this
  // mode, so requiring it would silently block submit. The visible name field
  // carries its own `isRequired`, and submission is gated by isSubmitDisabled.
  const {
    field: { onChange: onNameChange }
  } = useController({ control, name: 'entrance.name' });

  return (
    <FormRow>
      {entityType === ENTRANCE_AND_CAVE ? (
        <>
          <Box sx={{ flex: { xs: '1 1 100%', sm: 2 }, minWidth: 0 }}>
            <NameSuggestionDropdown
              control={control}
              formKey="cave.name"
              enabled={isNewEntrance}
            >
              <InputText
                formKey="cave.name"
                labelName="Entrance name"
                control={control}
                isError={!!errors?.cave?.name}
                isRequired
                onChangeAdditionalFn={onNameChange}
              />
            </NameSuggestionDropdown>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 0 }}>
            <InputLanguage
              formKey="cave.language"
              labelName="Cave name language"
              control={control}
              isError={!!errors?.cave?.language}
            />
          </Box>
        </>
      ) : (
        <>
          <Box sx={{ flex: { xs: '1 1 100%', sm: 2 }, minWidth: 0 }}>
            <NameSuggestionDropdown
              control={control}
              formKey="entrance.name"
              enabled={isNewEntrance}
            >
              <InputText
                formKey="entrance.name"
                labelName="Entrance name"
                control={control}
                isError={!!errors?.entrance?.name}
                isRequired
              />
            </NameSuggestionDropdown>
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: 0 }}>
            <InputLanguage
              formKey="entrance.language"
              labelName="Entrance name language"
              control={control}
              isError={!!errors?.entrance?.language}
            />
          </Box>
        </>
      )}
    </FormRow>
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
    })
  }),
  entityType: PropTypes.oneOf([ENTRANCE_ONLY, ENTRANCE_AND_CAVE]),
  isNewEntrance: PropTypes.bool
};

export default EditTypeSelection;
