import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import ActionButton from '../../common/ActionButton';

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: ${({ theme }) => theme.spacing(3)};
  & > button {
    margin-right: ${({ theme }) => theme.spacing(2)};
  }
`;

const TableActions = ({
  disableSelect,
  disableDelete,
  onClickSelect,
  onClickDelete
}) => {
  const { formatMessage } = useIntl();
  return (
    <Wrapper>
      <ActionButton
        label={formatMessage({ id: 'Select' })}
        color="primary"
        onClick={onClickSelect}
        disabled={disableSelect}
      />
      <ActionButton
        label={formatMessage({ id: 'Delete' })}
        color="primary"
        onClick={onClickDelete}
        disabled={disableDelete}
      />
    </Wrapper>
  );
};

export default TableActions;

TableActions.propTypes = {
  disableSelect: PropTypes.bool.isRequired,
  disableDelete: PropTypes.bool.isRequired,
  onClickSelect: PropTypes.func.isRequired,
  onClickDelete: PropTypes.func.isRequired
};
