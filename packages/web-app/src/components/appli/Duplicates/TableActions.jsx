import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import ActionButton from '../../common/ActionButton';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: row;
  margin-top: ${({ theme }) => theme.spacing(2)};
  & > button {
    margin-right: ${({ theme }) => theme.spacing(1)};
  }
`;

const TableActions = ({ isDisabled, onClickSelect, onClickDelete }) => {
  const { formatMessage } = useIntl();
  return (
    <Wrapper>
      <ActionButton
        label={formatMessage({ id: 'Select' })}
        color="primary"
        onClick={onClickSelect}
        disabled={isDisabled}
      />
      <ActionButton
        label={formatMessage({ id: 'Delete' })}
        color="primary"
        onClick={onClickDelete}
        disabled={isDisabled}
      />
    </Wrapper>
  );
};

export default TableActions;

TableActions.propTypes = {
  isDisabled: PropTypes.bool.isRequired,
  onClickSelect: PropTypes.func.isRequired,
  onClickDelete: PropTypes.func.isRequired
};
