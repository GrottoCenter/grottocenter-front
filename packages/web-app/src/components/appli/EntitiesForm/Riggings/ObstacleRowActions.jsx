import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { ButtonGroup, IconButton, Tooltip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';

const ButtonWrapper = styled('div')`
  display: flex;
  align-items: center;
`;

const ObstacleRowActions = ({
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  orientation = 'vertical'
}) => {
  const { formatMessage } = useIntl();

  return (
    <ButtonWrapper>
      <ButtonGroup orientation={orientation} size="small">
        <Tooltip title={formatMessage({ id: 'Move this line up' })}>
          <span>
            <IconButton
              onClick={onMoveUp}
              size="small"
              color="primary"
              disabled={isFirst}
              aria-label={formatMessage({ id: 'Move this line up' })}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={formatMessage({ id: 'Move this line down' })}>
          <span>
            <IconButton
              onClick={onMoveDown}
              size="small"
              color="primary"
              disabled={isLast}
              aria-label={formatMessage({ id: 'Move this line down' })}>
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </ButtonGroup>
      <Tooltip title={formatMessage({ id: 'Delete this line' })}>
        <IconButton
          onClick={onDelete}
          size="small"
          color="error"
          aria-label={formatMessage({ id: 'Delete this line' })}>
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </ButtonWrapper>
  );
};

ObstacleRowActions.propTypes = {
  isFirst: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  orientation: PropTypes.oneOf(['vertical', 'horizontal'])
};

export default ObstacleRowActions;
