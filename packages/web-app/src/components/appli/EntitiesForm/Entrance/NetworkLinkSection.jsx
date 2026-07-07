import { Checkbox, FormControlLabel } from '@mui/material';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import CaveSelection from './CaveSelect';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';

import Alert from '../../../common/Alert';
import { FormSection } from '../utils/FormContainers';
import LinkOutcomeAlert from '../utils/LinkOutcomeAlert';

// Create-mode network opt-in: a checkbox reveals the cave/network search,
// with a preview of the outcome (new 2-entrance network vs extending an
// existing one). Edit-mode network status/actions live in
// NetworkMembershipSection instead.
//
// `selectedCave`/`onSelectedCaveChange` are controlled by the parent (not
// local state): CaveDetail also needs the selected network's name (to link to
// it), and it's not backed by the shared `cave.name` RHF field — writing the
// searched network's name there would bleed into the entrance/cave name field
// once the user switches back to "new cave" mode.
const NetworkLinkSection = ({
  control,
  errors,
  entityType,
  updateEntityType,
  reset,
  selectedCave,
  onSelectedCaveChange
}) => {
  const { formatMessage } = useIntl();
  // Selection-time hint, not a value the form submits.
  const [selectedNbEntrances, setSelectedNbEntrances] = useState(null);

  const handleLinkToggle = event => {
    const isLinked = event.target.checked;
    updateEntityType(isLinked ? ENTRANCE_ONLY : ENTRANCE_AND_CAVE);
    onSelectedCaveChange(null);
    setSelectedNbEntrances(null);
    reset();
  };

  return (
    <FormSection title="Network">
      <FormControlLabel
        control={
          <Checkbox
            checked={entityType === ENTRANCE_ONLY}
            onChange={handleLinkToggle}
          />
        }
        label={formatMessage({
          id: 'Link to an existing entrance or network'
        })}
      />
      {entityType === ENTRANCE_ONLY && (
        <>
          <CaveSelection
            control={control}
            errors={errors}
            value={selectedCave}
            onSelectionChange={selection => {
              onSelectedCaveChange(selection?.id ? selection : null);
              setSelectedNbEntrances(
                typeof selection?.nbEntrances === 'number'
                  ? selection.nbEntrances
                  : null
              );
            }}
          />
          {errors?.caveName && (
            <Alert severity="error" content={errors.caveName} />
          )}
          <LinkOutcomeAlert
            targetNbEntrances={selectedNbEntrances}
            disableMargins
          />
        </>
      )}
    </FormSection>
  );
};

NetworkLinkSection.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    caveName: PropTypes.string
  }),
  entityType: PropTypes.oneOf([ENTRANCE_ONLY, ENTRANCE_AND_CAVE]),
  updateEntityType: PropTypes.func.isRequired,
  reset: PropTypes.func.isRequired,
  selectedCave: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string
  }),
  onSelectedCaveChange: PropTypes.func.isRequired
};

export default NetworkLinkSection;
