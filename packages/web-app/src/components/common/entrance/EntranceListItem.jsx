import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { ListItem, ListItemText } from '@material-ui/core';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const StyledListItem = styled(ListItem)`
  flex-basis: 25%;
  min-width: 250px;
`;

const EntranceListItem = ({ entrance }) => {
  const { formatMessage } = useIntl();

  return (
    <StyledListItem
      button
      component={React.forwardRef((props, ref) => (
        <Link {...props} to={`/ui/entrances/${entrance.id}`} ref={ref} />
      ))}>
      <ListItemText
        primary={
          entrance.name ? (
            entrance.name
          ) : (
            <i sx="color : gray">{formatMessage({ id: 'no name' })}</i>
          )
        }
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }} // Multiple lines text
      />
    </StyledListItem>
  );
};

EntranceListItem.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })
};
EntranceListItem.defaultProps = {
  entrance: undefined
};

export default EntranceListItem;
