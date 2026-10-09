import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';

import { FormRow } from '../utils/FormContainers';
import InputLanguage from '../utils/InputLanguage';
import InputText from '../utils/InputText';
import NameSuggestionDropdown from './NameSuggestionDropdown';

const EditTypeSelection = ({
  control,
  errors,
  entityType,
  isNewEntrance = false,
  setValue
}) => (
  <FormRow>
    {entityType === ENTRANCE_AND_CAVE ? (
      <>
        <Box sx={{ flex: { xs: '1 1 100%', sm: 2 }, minWidth: 0 }}>
          <NameSuggestionDropdown
            control={control}
            formKey="cave.name"
            enabled={isNewEntrance}>
            <InputText
              formKey="cave.name"
              labelName="Entrance name"
              control={control}
              isError={!!errors?.cave?.name}
              isRequired
              maxLength={TEXT_LENGTH_LIMITS.ENTITY_NAME}
              onChangeAdditionalFn={event =>
                setValue('entrance.name', event.target.value)
              }
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
            enabled={isNewEntrance}>
            <InputText
              formKey="entrance.name"
              labelName="Entrance name"
              control={control}
              isError={!!errors?.entrance?.name}
              isRequired
              maxLength={TEXT_LENGTH_LIMITS.ENTITY_NAME}
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

EditTypeSelection.propTypes = {
  control: PropTypes.shape({}),
  setValue: PropTypes.func.isRequired,
  errors: PropTypes.shape({
    cave: PropTypes.shape({
      name: PropTypes.shape({ message: PropTypes.string }),
      language: PropTypes.shape({ message: PropTypes.string })
    }),
    entrance: PropTypes.shape({
      name: PropTypes.shape({ message: PropTypes.string }),
      language: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  entityType: PropTypes.oneOf([ENTRANCE_ONLY, ENTRANCE_AND_CAVE]),
  isNewEntrance: PropTypes.bool
};

export default EditTypeSelection;
