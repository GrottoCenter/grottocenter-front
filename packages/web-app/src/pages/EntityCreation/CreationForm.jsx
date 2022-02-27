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
import { EntranceForm } from '../../components/appli/EntitiesForm';

const Header = styled.div`
  display: flex;
  align-items: center;
`;

const StyledFormControl = styled(FormControl)`
  width: 300px;
`;

const ENTITY = {
  entrance: 'entrance',
  cavity: 'cavity',
  massif: 'massif',
  organization: 'organization'
};

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing(4)}px;
`;

const EntityTypeSelect = ({ entity, onEntityChange }) => {
  const [selectedEntity, setSelectedEntity] = useState(entity);

  const handleChange = event => {
    if (includes(event.target.value, values(ENTITY))) {
      setSelectedEntity(event.target.value);
      onEntityChange(event.target.value);
    }
  };

  return (
    <StyledFormControl variant="filled" required>
      <InputLabel shrink>
        <Translate>Entity type</Translate>
      </InputLabel>
      <Select
        value={selectedEntity}
        onChange={handleChange}
        displayEmpty
        disabled>
        <MenuItem value={ENTITY.entrance}>
          <Translate>entrance</Translate>
        </MenuItem>
        <MenuItem value={ENTITY.cavity}>
          <Translate>cave</Translate>
        </MenuItem>
        <MenuItem value={ENTITY.massif}>
          <Translate>massif</Translate>
        </MenuItem>
        <MenuItem value={ENTITY.organization}>
          <Translate>organization</Translate>
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
    case ENTITY.entrance:
      return <EntranceForm />;
    case ENTITY.massif:
    case ENTITY.cavity:
    case ENTITY.organization:
    default:
      return (
        <div>
          <Translate>Not implemented yet</Translate>
        </div>
      );
  }
};
const CreationForm = () => {
  const [selectedEntity, setSelectedEntity] = useState(ENTITY.entrance);

  return (
    <>
      <Header>
        <Translate>Entrance, cave ...</Translate>
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
  selectedEntity: PropTypes.oneOf(values(ENTITY)).isRequired
};

EntityTypeSelect.propTypes = {
  entity: PropTypes.oneOf(values(ENTITY)).isRequired,
  onEntityChange: PropTypes.func.isRequired
};

export default CreationForm;
