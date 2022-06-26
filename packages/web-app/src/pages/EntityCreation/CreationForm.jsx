import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@material-ui/core';
import styled from 'styled-components';
import { includes, values } from 'ramda';
import Translate from '../../components/common/Translate';
import OrganizationForm from '../../components/appli/EntitiesForm/Organization';
import { EntranceForm, MassifForm } from '../../components/appli/EntitiesForm';

const Header = styled.div`
  display: flex;
  align-items: center;
`;

const StyledFormControl = styled(FormControl)`
  width: 300px;
`;

const ENTITIES = {
  entrance: 'Entrance',
  massif: 'Massif',
  organization: 'Organization'
};

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing(4)}px;
`;

const EntityTypeSelect = ({ entity, onEntityChange }) => {
  const [selectedEntity, setSelectedEntity] = useState(entity);

  const handleChange = event => {
    if (includes(event.target.value, values(ENTITIES))) {
      setSelectedEntity(event.target.value);
      onEntityChange(event.target.value);
    }
  };

  return (
    <StyledFormControl variant="filled" required>
      <InputLabel shrink>
        <Translate>Entity type</Translate>
      </InputLabel>
      <Select value={selectedEntity} onChange={handleChange} displayEmpty>
        <MenuItem value={ENTITIES.entrance}>
          <Translate>Entrance</Translate>
        </MenuItem>
        <MenuItem value={ENTITIES.massif}>
          <Translate>Massif</Translate>
        </MenuItem>
        <MenuItem value={ENTITIES.organization}>
          <Translate>Organization</Translate>
        </MenuItem>
      </Select>
      <FormHelperText>
        <Translate>Type of the new entity to create</Translate>
      </FormHelperText>
    </StyledFormControl>
  );
};

const EntityForm = ({ selectedEntity }) => {
  switch (selectedEntity) {
    case ENTITIES.entrance:
      return <EntranceForm />;
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
      <Header>
        <Translate>
          Create a new entity in Grottocenter
        </Translate>
      </Header>
      <hr />
      <Wrapper>
        <EntityTypeSelect
          entity={selectedEntity}
          onEntityChange={setSelectedEntity}
        />
        <EntityForm selectedEntity={selectedEntity} />
      </Wrapper>
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
