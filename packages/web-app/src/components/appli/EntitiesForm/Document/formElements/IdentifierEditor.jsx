import React, { useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';
import {
  Fade,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Typography
} from '@mui/material';
import { useIntl } from 'react-intl';

import Translate from '../../../../common/Translate';
import { DocumentFormContext } from '../Provider';
import StringInput from '../../../../common/Form/StringInput';
import { loadIdentifierTypes } from '../../../../../actions/IdentifierType';

const InlineWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const IdentifierContainer = styled('div')`
  flex: 12;
  min-width: 300px;
`;

const IdentifierTypeContainer = styled('div')`
  flex: 5;
  min-width: 200px;
`;

const IdentifierEditor = () => {
  const dispatch = useDispatch();
  const { identifierTypes: allIdentifierTypes } = useSelector(
    state => state.identifierType
  );
  const { formatMessage } = useIntl();
  const { document, updateAttribute } = useContext(DocumentFormContext);

  useEffect(() => {
    dispatch(loadIdentifierTypes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const identifierType = useMemo(() => {
    if (!document.identifierType) return null;

    if (!document.identifierType.id)
      return allIdentifierTypes.find(e => e.id === document.identifierType);

    return document.identifierType;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allIdentifierTypes, document.identifierType]);

  const regexp = identifierType?.regexp ?? null;
  const isRegexpValid =
    regexp === null ? true : new RegExp(regexp).test(document.identifier);

  const handleIdentifierChange = newIdentifier => {
    if (newIdentifier === '') {
      updateAttribute('identifier', null);
      updateAttribute('identifierType', null);
    }
    updateAttribute('identifier', newIdentifier);
  };

  const handleIdentifierTypeChange = newIdentifierTypeId => {
    const newIdType =
      allIdentifierTypes.find(idType => idType.id === newIdentifierTypeId) ??
      null;
    updateAttribute('identifierType', newIdType);
  };

  const shouldShowIdentifierTypeInput =
    document.identifier || identifierType !== null;

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
              id: 'Code for designating a document in a unique way. This can be a DOI, URL, ISBN or ISSN.'
            })}
            onValueChange={handleIdentifierChange}
            value={document.identifier}
            valueName={formatMessage({ id: 'Identifier' })}
            required={identifierType !== null}
            hasError={identifierType !== null && !isRegexpValid}
          />
        </IdentifierContainer>

        {shouldShowIdentifierTypeInput && (
          <Fade in={shouldShowIdentifierTypeInput}>
            <IdentifierTypeContainer>
              <FormControl
                variant="filled"
                required={document.identifier}
                fullWidth
                error={!identifierType}>
                <InputLabel htmlFor="identifier-type">
                  <Translate>Identifier Type</Translate>
                </InputLabel>
                <Select
                  value={identifierType?.id ?? -1}
                  onChange={event =>
                    handleIdentifierTypeChange(event.target.value)
                  }
                  inputProps={{
                    code: `identifier-type`,
                    name: `identifier-type`
                  }}>
                  <MenuItem key={-1} value={-1}>
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

IdentifierEditor.propTypes = {};

export default IdentifierEditor;
