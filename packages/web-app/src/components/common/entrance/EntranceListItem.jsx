import React from 'react';
import { useIntl } from 'react-intl';
import { ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import idNameType from '../../../types/idName.type';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const EntranceListItem = ({ entrance, onRemove, showRemove }) => {
  const { formatMessage } = useIntl();

  if (showRemove) {
    return (
      <StyledListItem>
        <Link
          to={`/ui/entrances/${entrance.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemText
            primary={
              entrance.name ? (
                entrance.name
              ) : (
                <i>{formatMessage({ id: 'no name' })}</i>
              )
            }
            primaryTypographyProps={{ style: { whiteSpace: 'normal' } }}
          />
        </Link>
        {onRemove && (
          <Tooltip title={formatMessage({ id: 'Remove from organization' })}>
            <IconButton
              size="small"
              onClick={() => onRemove(entrance.id)}
              color="error">
              <RemoveCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </StyledListItem>
    );
  }

  return (
    <StyledListItem
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/entrances/${entrance.id}`} ref={ref} />
      ))}>
      <ListItemText
        primary={
          entrance.name ? (
            entrance.name
          ) : (
            <i>{formatMessage({ id: 'no name' })}</i>
          )
        }
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }}
      />
    </StyledListItem>
  );
};

EntranceListItem.propTypes = {
  entrance: idNameType,
  onRemove: PropTypes.func,
  showRemove: PropTypes.bool
};

export default EntranceListItem;
