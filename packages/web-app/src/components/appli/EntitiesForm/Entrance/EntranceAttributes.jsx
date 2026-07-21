import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { FormSection } from '../utils/FormContainers';
import BoolToggleChip from '../utils/BoolToggleChip';
import { ENTRANCE_HAZARD_FIELDS } from '../../../../conf/entranceCharacteristics';

// Hazards & access restrictions rendered as a wrapping group of icon toggle
// chips. Selected = the point of attention applies to this entrance.
const EntranceAttributes = ({ control }) => (
  <FormSection title="Hazards & restrictions">
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {ENTRANCE_HAZARD_FIELDS.map(({ field, label, icon }) => (
        <BoolToggleChip
          key={field}
          name={`entrance.${field}`}
          label={label}
          icon={icon}
          control={control}
        />
      ))}
    </Box>
  </FormSection>
);

EntranceAttributes.propTypes = {
  control: PropTypes.shape({})
};

export default EntranceAttributes;
