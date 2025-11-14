import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { Avatar, Box, ListItem, ListItemText, Typography, IconButton, Tooltip } from '@mui/material';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const SmallAvatar = styled(Avatar)`
  height: 2.5rem;
  width: 2.5rem;
`;

const StyledListItem = styled(ListItem)`
  align-items: flex-start;
  display: flex;
  flex-basis: 25%;
  flex-direction: column;
  min-width: 250px;
`;

const CaveListItem = ({ cave, onRemove, showRemove }) => {
  const { locale } = useSelector(state => state.intl);
  const { formatMessage } = useIntl();

  if (showRemove) {
    return (
      <StyledListItem dense>
        <Box display="flex" alignItems="center" width="100%">
          <Link
            to={`/ui/caves/${cave.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItemText primary={cave.name} />
          </Link>
          {onRemove && (
            <Tooltip title={formatMessage({ id: 'Remove from organization' })}>
              <IconButton
                size="small"
                onClick={() => onRemove(cave.id)}
                color="error">
                <RemoveCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {(cave.depth || cave.length) && (
          <Box display="flex" flexDirection="row" alignItems="flex-start">
            {cave.depth && (
              <>
                <SmallAvatar
                  alt="Cave depth icon"
                  src="/images/depth.svg"
                  variant="square"
                />
                <Typography variant="caption">{`${cave.depth.toLocaleString(
                  locale
                )}m`}</Typography>
                &nbsp;
              </>
            )}
            {cave.length && (
              <>
                <SmallAvatar
                  alt="Cave length icon"
                  src="/images/length.svg"
                  variant="square"
                />
                <Typography variant="caption">{`${cave.length.toLocaleString(
                  locale
                )}m`}</Typography>
              </>
            )}
          </Box>
        )}
      </StyledListItem>
    );
  }

  return (
    <StyledListItem
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/caves/${cave.id}`} ref={ref} />
      ))}
      dense>
      <ListItemText primary={cave.name} />
      {(cave.depth || cave.length) && (
        <Box display="flex" flexDirection="row" alignItems="flex-start">
          {cave.depth && (
            <>
              <SmallAvatar
                alt="Cave depth icon"
                src="/images/depth.svg"
                variant="square"
              />
              <Typography variant="caption">{`${cave.depth.toLocaleString(
                locale
              )}m`}</Typography>
              &nbsp;
            </>
          )}
          {cave.length && (
            <>
              <SmallAvatar
                alt="Cave length icon"
                src="/images/length.svg"
                variant="square"
              />
              <Typography variant="caption">{`${cave.length.toLocaleString(
                locale
              )}m`}</Typography>
            </>
          )}
        </Box>
      )}
    </StyledListItem>
  );
};

CaveListItem.propTypes = {
  cave: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    depth: PropTypes.number,
    length: PropTypes.number
  }),
  onRemove: PropTypes.func,
  showRemove: PropTypes.bool
};

export default CaveListItem;
