import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Box, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const CaveDepthIcon = styled.img`
  width: 2.5rem;
`;

const CaveLengthIcon = styled.img`
  width: 2.5rem;
`;

const StyledListItem = styled(ListItem)`
  align-items: flex-start;
  display: flex;
  flex-basis: 25%;
  flex-direction: column;
  min-width: 250px;
`;

const CaveListItem = ({ cave }) => {
  const { locale } = useSelector(state => state.intl);
  return (
    <StyledListItem
      button
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/caves/${cave.id}`} ref={ref} />
      ))}
      dense>
      <ListItemText primary={cave.name} />
      {(cave.depth || cave.length) && (
        <Box display="flex" flexDirection="row" alignItems="flex-start">
          {cave.depth !== null && (
            <ListItem dense>
              <ListItemIcon>
                <CaveDepthIcon src="/images/depth.svg" alt="Cave depth icon" />
              </ListItemIcon>
              <ListItemText
                secondary={`${cave.depth.toLocaleString(locale)}m`}
              />
            </ListItem>
          )}
          {cave.length !== null && (
            <ListItem dense>
              <ListItemIcon>
                <CaveLengthIcon
                  src="/images/length.svg"
                  alt="Cave length icon"
                />
              </ListItemIcon>
              <ListItemText
                secondary={`${cave.length.toLocaleString(locale)}m`}
              />
            </ListItem>
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
  })
};
CaveListItem.defaultProps = {
  cave: undefined
};

export default CaveListItem;
