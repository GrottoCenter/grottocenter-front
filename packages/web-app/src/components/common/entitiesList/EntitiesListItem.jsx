import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Avatar, Box, ListItem, ListItemText, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';

const SmallAvatar = styled(Avatar)`
  height: 2.5rem;
  width: 2.5rem;
`;

const StyledListItemCave = styled(ListItem)`
  align-items: flex-start;
  display: flex;
  flex-basis: 25%;
  flex-direction: column;
  min-width: 250px;
`;

export const CaveListItem = ({ cave, itemActionButton }) => {
  const { locale } = useSelector(state => state.intl);

  return (
    <StyledListItemCave dense>
      <Box display="flex" alignItems="center">
        <Link
          to={`/ui/caves/${cave.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}>
          <ListItemText primary={cave.name} />
        </Link>
        {itemActionButton}
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
    </StyledListItemCave>
  );
};

CaveListItem.propTypes = {
  cave: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    depth: PropTypes.number,
    length: PropTypes.number
  }),
  itemActionButton: PropTypes.node
};

const StyledListItemDefault = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

export const DefaultListItem = ({
  link,
  label,
  isMultiline = false,
  itemActionButton
}) => (
  <StyledListItemDefault sx={{ display: 'flex', alignItems: 'center' }}>
    <Link to={link} style={{ textDecoration: 'none', color: 'inherit' }}>
      <ListItemText
        primary={label}
        primaryTypographyProps={
          isMultiline ? { style: { whiteSpace: 'normal' } } : {}
        }
      />
    </Link>
    {itemActionButton}
  </StyledListItemDefault>
);

DefaultListItem.propTypes = {
  link: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  isMultiline: PropTypes.bool,
  itemActionButton: PropTypes.node
};
