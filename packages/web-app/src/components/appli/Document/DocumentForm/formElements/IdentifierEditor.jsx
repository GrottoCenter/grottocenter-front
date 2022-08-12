import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  Fade,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import { pathOr } from 'ramda';

import Translate from '../../../../common/Translate';
import useDocumentTypes from '../../../../../hooks/useDocumentTypes';
import { DocumentFormContext } from '../Provider';
import StringInput from '../../../../common/Form/StringInput';
import idNameType from '../../../../../types/idName.type';

// ===================================
const InlineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const IdentifierContainer = styled.div`
  flex: 12;
  min-width: 300px;
`;

const IdentifierTypeContainer = styled.div`
  flex: 5;
  min-width: 200px;
`;
// ===================================

const IdentifierEditor = ({
  allIdentifierTypes,
  contextIdentifierValueName,
  contextIdentifierTypeValueName,
  documentType
}) => {
  const { formatMessage } = useIntl();
  const {
    docAttributes: {
      [contextIdentifierValueName]: identifier,
      [contextIdentifierTypeValueName]: identifierType
    },
    updateAttribute
  } = useContext(DocumentFormContext);
  const { isOther } = useDocumentTypes();

  const regexp = pathOr(null, ['regexp'], identifierType);
  const isRegexpValid =
    regexp === null ? true : new RegExp(regexp).test(identifier);

  const handleIdentifierChange = newIdentifier => {
    if (newIdentifier === '') {
      updateAttribute(contextIdentifierValueName, null);
      updateAttribute(contextIdentifierTypeValueName, null);
    }
    updateAttribute(contextIdentifierValueName, newIdentifier);
  };

  const handleIdentifierTypeChange = newIdentifierTypeId => {
    const newIdType = allIdentifierTypes.find(
      idType => idType.id === newIdentifierTypeId
    );
    updateAttribute(contextIdentifierTypeValueName, newIdType);
  };

  return (
    <>
      {!isRegexpValid && (
        <Typography align="center" color="error">
          <Translate>
            The identifier must match the identifier type format.
          </Translate>
        </Typography>
      )}
      <InlineWrapper>
        <IdentifierContainer>
          <StringInput
            helperText={formatMessage({
              id:
                'Code for designating a document in a unique way. This can be a DOI, URL, ISBN or ISSN.'
            })}
            onValueChange={handleIdentifierChange}
            value={identifier}
            valueName={formatMessage({ id: 'Identifier' })}
            required={identifierType !== null}
            hasError={identifierType !== null && !isRegexpValid}
          />
        </IdentifierContainer>

        {identifier !== '' && (
          <Fade in={identifier !== ''}>
            <IdentifierTypeContainer>
              <FormControl
                variant="filled"
                required={!isOther(documentType) && identifier !== ''}
                fullWidth
                error={!isOther(documentType) && !identifierType}>
                <InputLabel htmlFor="identifier-type">
                  <Translate>Identifier Type</Translate>
                </InputLabel>
                <Select
                  value={identifierType ? identifierType.id : -1}
                  onChange={event =>
                    handleIdentifierTypeChange(event.target.value)
                  }
                  inputProps={{
                    code: `identifier-type`,
                    name: `identifier-type`
                  }}>
                  <MenuItem key={-1} value={-1} disabled>
                    <i>
                      <Translate>Select an identifier type</Translate>
                    </i>
                  </MenuItem>
                  {allIdentifierTypes.map(idType => (
                    <MenuItem key={idType.id} value={idType.id}>
                      {idType.id.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>

                <FormHelperText>
                  {/* <Translate>
                  Some helper text for Identifier Type.
                  </Translate> */}
                </FormHelperText>
              </FormControl>
            </IdentifierTypeContainer>
          </Fade>
        )}
      </InlineWrapper>
    </>
  );
};

IdentifierEditor.propTypes = {
  allIdentifierTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired
    })
  ),
  contextIdentifierValueName: PropTypes.string.isRequired,
  contextIdentifierTypeValueName: PropTypes.string.isRequired,
  documentType: idNameType.isRequired
};

export default IdentifierEditor;
