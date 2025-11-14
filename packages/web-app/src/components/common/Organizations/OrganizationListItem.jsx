import React from 'react';
import PropTypes from 'prop-types';
import { ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import idNameType from '../../../types/idName.type';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const OrganizationListItem = ({ orga, onRemove, showRemove }) => {
  const { formatMessage } = useIntl();

  if (showRemove) {
    return (
      <StyledListItem sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Link
          to={`/ui/organizations/${orga.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemText
            primary={orga.name}
            primaryTypographyProps={{ style: { whiteSpace: 'normal' } }}
          />
        </Link>
        {onRemove && (
          <Tooltip title={formatMessage({ id: 'Leave organization' })}>
            <IconButton
              size="small"
              onClick={() => onRemove(orga.id)}
              color="error">
              <PersonRemoveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </StyledListItem>
    );
  }

  return (
    <StyledListItem
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/organizations/${orga.id}`} ref={ref} />
      ))}>
      <ListItemText
        primary={orga.name}
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }}
      />
    </StyledListItem>
  );
};

OrganizationListItem.propTypes = {
  orga: idNameType,
  onRemove: PropTypes.func,
  showRemove: PropTypes.bool
};

export default OrganizationListItem;
