import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  FormControl,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormLabel
} from '@material-ui/core';
import styled from 'styled-components';
import { includes, values } from 'ramda';
import Translate from '../../components/common/Translate';
import OrganizationForm from '../../components/appli/EntitiesForm/Organization';
import { EntranceForm, MassifForm } from '../../components/appli/EntitiesForm';
import DocumentSubmission from '../../components/appli/EntitiesForm/Document';

const StyledFormControl = styled(FormControl)`
  margin-bottom: 2em;
`;

const ENTITIES = {
  entrance: 'Entrance',
  massif: 'Massif',
  organization: 'Organization',
  document: 'Document'
};

const EntityTypeSelect = ({ entity, onEntityChange }) => {
  const [selectedEntity, setSelectedEntity] = useState(entity);
  const { formatMessage } = useIntl();

  const handleChange = event => {
    if (includes(event.target.value, values(ENTITIES))) {
      setSelectedEntity(event.target.value);
      onEntityChange(event.target.value);
    }
  };

  return (
    <StyledFormControl variant="filled" required>
      <FormLabel>
        <Translate>Entity type</Translate>
      </FormLabel>
      <RadioGroup row value={selectedEntity} onChange={handleChange}>
        <FormControlLabel
          labelPlacement="bottom"
          control={<Radio />}
          value={ENTITIES.entrance}
          label={formatMessage({ id: 'Entrance' })}
        />
        <FormControlLabel
          labelPlacement="bottom"
          control={<Radio />}
          value={ENTITIES.document}
          label={formatMessage({ id: 'Document' })}
        />
        <FormControlLabel
          labelPlacement="bottom"
          control={<Radio />}
          value={ENTITIES.massif}
          label={formatMessage({ id: 'Massif' })}
        />
        <FormControlLabel
          labelPlacement="bottom"
          control={<Radio />}
          value={ENTITIES.organization}
          label={formatMessage({ id: 'Organization' })}
        />
      </RadioGroup>
    </StyledFormControl>
  );
};

const EntityForm = ({ selectedEntity }) => {
  switch (selectedEntity) {
    case ENTITIES.entrance:
      return <EntranceForm />;
    case ENTITIES.document:
      return <DocumentSubmission />;
    case ENTITIES.massif:
      return <MassifForm />;
    case ENTITIES.organization:
      return <OrganizationForm />;

    default:
      return (
        <div>
          <Translate>Not implemented yet</Translate>
        </div>
      );
  }
};
const CreationForm = () => {
  const [selectedEntity, setSelectedEntity] = useState(ENTITIES.entrance);

  return (
    <>
      <EntityTypeSelect
        entity={selectedEntity}
        onEntityChange={setSelectedEntity}
      />
      <EntityForm selectedEntity={selectedEntity} />
    </>
  );
};

EntityForm.propTypes = {
  selectedEntity: PropTypes.oneOf(values(ENTITIES)).isRequired
};

EntityTypeSelect.propTypes = {
  entity: PropTypes.oneOf(values(ENTITIES)).isRequired,
  onEntityChange: PropTypes.func.isRequired
};

export default CreationForm;
