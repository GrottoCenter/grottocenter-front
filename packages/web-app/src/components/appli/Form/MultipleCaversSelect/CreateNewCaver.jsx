import React, { useContext, useEffect, useRef, useState } from 'react';
import { isEmpty, isNil } from 'ramda';
import { TextField } from '@mui/material';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import AddIcon from '@mui/icons-material/Add';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { postPerson } from '../../../../actions/Person/CreatePerson';
import ActionButton from '../../../common/ActionButton';
import { DocumentFormContext } from '../../Document/DocumentForm/Provider';

const Wrapper = styled.form`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const CreateNewCaver = ({
  defaultName = '',
  defaultSurname = '',
  enabled,
  onCreateSuccess,
  contextValueName
}) => {
  const dispatch = useDispatch();
  const { isLoading, caver } = useSelector(state => state.createPerson);
  const {
    docAttributes: { [contextValueName]: value },
    updateAttribute
  } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const inputRef = useRef(null);
  const [name, setName] = useState(defaultName);
  const [surname, setSurname] = useState(defaultSurname);
  const handleChangeName = event => {
    setName(event.target.value);
  };
  const handleChangeSurname = event => {
    setSurname(event.target.value);
  };

  const handleSubmit = () => {
    dispatch(postPerson({ name, surname }));
  };

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);
  useEffect(() => {
    setSurname(defaultSurname);
  }, [defaultSurname]);

  // Handle autofocus when opened
  useEffect(() => {
    if (enabled) {
      inputRef.current.focus();
    }
  }, [enabled, inputRef]);

  useEffect(() => {
    if (!isNil(caver) && !isEmpty(name) && !isEmpty(surname)) {
      updateAttribute(contextValueName, [...value, caver]);
      onCreateSuccess();
      setName('');
      setSurname('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caver]);

  return (
    <Wrapper>
      <TextField
        inputRef={inputRef}
        variant="standard"
        disabled={isLoading}
        id="create-caver-name-input"
        label={formatMessage({ id: 'Caver.Name' })}
        value={name}
        onChange={handleChangeName}
        fullWidth
      />
      <TextField
        variant="standard"
        disabled={isLoading}
        id="create-caver-surname-input"
        label={formatMessage({ id: 'Surname' })}
        value={surname}
        onChange={handleChangeSurname}
        fullWidth
      />
      <ActionButton
        color="secondary"
        label={formatMessage({ id: 'create' })}
        onClick={handleSubmit}
        disabled={isEmpty(name) || isEmpty(surname) || isLoading}
        loading={isLoading}
        icon={<AddIcon />}
        fullWidth
      />
    </Wrapper>
  );
};

CreateNewCaver.propTypes = {
  defaultName: PropTypes.string,
  defaultSurname: PropTypes.string,
  enabled: PropTypes.bool,
  onCreateSuccess: PropTypes.func,
  contextValueName: PropTypes.string.isRequired
};

export default CreateNewCaver;
