import React from 'react';
import { useIntl } from 'react-intl';
import { Controller, useFieldArray } from 'react-hook-form';
import { Button, IconButton, TextField } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const StyledButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(2)}px;
`;

const DescriptionWrapper = styled.div`
  padding-bottom: ${({ theme }) => theme.spacing(2)}px;
`;

const CenterDiv = styled.div`
  margin: auto;
`;

const FullWidthDiv = styled.div`
  width: 100%;
`;

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Description = ({ nestIndex, control, remove, errors }) => {
  const { formatMessage } = useIntl();

  return (
    <Wrapper>
      <FullWidthDiv>
        <Controller
          name={`descriptions.${nestIndex}.title`}
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.descriptions?.[nestIndex]?.title}
              label={formatMessage({ id: 'Description title' })}
              inputRef={ref}
              {...field}
            />
          )}
        />
        <Controller
          name={`descriptions.${nestIndex}.body`}
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              required
              error={!!errors?.descriptions?.[nestIndex]?.body}
              multiline
              fullWidth
              rows={4}
              label={formatMessage({ id: 'Description' })}
              inputRef={ref}
              {...field}
            />
          )}
        />
      </FullWidthDiv>
      <CenterDiv>
        <IconButton
          onClick={() => remove(nestIndex)}
          aria-label="delete description">
          <DeleteIcon fontSize="small" />
        </IconButton>
      </CenterDiv>
    </Wrapper>
  );
};

const Descriptions = ({ control, errors }) => {
  const { formatMessage } = useIntl();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'descriptions'
  });

  return (
    <>
      {fields.map((field, index) => (
        <DescriptionWrapper key={field.id}>
          <Description
            nestIndex={index}
            {...{ control }}
            remove={remove}
            errors={errors}
          />
        </DescriptionWrapper>
      ))}
      <StyledButton
        variant="text"
        size="small"
        startIcon={<AddIcon />}
        onClick={() =>
          append({
            title: '',
            body: ''
          })
        }>
        {formatMessage({ id: 'Add a description' })}
      </StyledButton>
    </>
  );
};

Descriptions.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.arrayOf(PropTypes.shape({}))
};

Description.propTypes = {
  nestIndex: PropTypes.number,
  control: PropTypes.shape({}),
  remove: PropTypes.func,
  errors: PropTypes.shape({
    descriptions: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        body: PropTypes.string
      })
    )
  })
};

export default Descriptions;
