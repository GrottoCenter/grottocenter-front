import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
import { EntryForm } from '../../components/appli/EntitiesForm';

const Header = styled.div`
  display: flex;
  align-items: center;
`;

const ENTITY = {
  entry: 'entry',
  cavity: 'cavity',
  massif: 'massif',
  organization: 'organization'
};

const EntityTypeSelect = ({ entity, onEntityChange }) => {
  const [selectedEntity, setSelectedEntity] = useState(entity);

  const handleChange = event => {
    if (includes(event.target.value, values(ENTITY))) {
      setSelectedEntity(event.target.value);
      onEntityChange(event.target.value);
    }
  };

  return (
    <FormControl ariant="filled" required fullWidth>
      <InputLabel shrink id="demo-simple-select-placeholder-label-label">
        <Translate>Creation type</Translate>
      </InputLabel>
      <Select value={selectedEntity} onChange={handleChange} displayEmpty>
        <MenuItem value={ENTITY.entry}>
          <Translate>entry</Translate>
        </MenuItem>
        <MenuItem value={ENTITY.cavity}>
          <Translate>cavity</Translate>
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
    </FormControl>
  );
};

const EntityForm = ({ selectedEntity, allLanguages }) => {
  switch (selectedEntity) {
    case ENTITY.entry:
      return <EntryForm allLanguages={allLanguages} />;
    case ENTITY.massif:
      return <EntryForm allLanguages={allLanguages} />;
    case ENTITY.cavity:
      return <EntryForm allLanguages={allLanguages} />;
    case ENTITY.organization:
      return <EntryForm allLanguages={allLanguages} />;
    default:
      return <EntryForm allLanguages={allLanguages} />;
  }
};
const CreationForm = () => {
  const { languages: allLanguages } = useSelector(state => state.language);

  const [selectedEntity, setSelectedEntity] = useState(ENTITY.entry);
  return (
    <>
      <Header>
        <Translate>
          The BBS is now directly integrated in Grottocenter and provides a
          summary of any document published on paper or online.
        </Translate>
      </Header>
      <hr />
      <EntityTypeSelect
        entity={selectedEntity}
        onEntityChange={setSelectedEntity}
      />
      <EntityForm selectedEntity={selectedEntity} allLanguages={allLanguages} />
    </>
  );
};

EntityForm.propTypes = {
  selectedEntity: PropTypes.oneOfType(values(ENTITY)).isRequired,
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  )
};

EntityTypeSelect.propTypes = {
  entity: PropTypes.oneOfType(values(ENTITY)).isRequired,
  onEntityChange: PropTypes.func.isRequired
};

export default CreationForm;
