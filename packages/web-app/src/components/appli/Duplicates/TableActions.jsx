import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import DeleteIcon from '@mui/icons-material/Delete';
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
        label={formatMessage({ id: 'Manage' })}
        color="primary"
        onClick={onClickSelect}
        disabled={isDisabled}
        icon={<CallMergeIcon />}
      />
      <ActionButton
        label={formatMessage({ id: 'Delete' })}
        color="error"
        onClick={onClickDelete}
        disabled={isDisabled}
        icon={<DeleteIcon />}
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
