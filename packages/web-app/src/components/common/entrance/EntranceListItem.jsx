import React from 'react';
import { useIntl } from 'react-intl';
import { ListItem, ListItemText } from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import idNameType from '../../../types/idName.type';

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
            <i>{formatMessage({ id: 'no name' })}</i>
          )
        }
        primaryTypographyProps={{ style: { whiteSpace: 'normal' } }} // Multiple lines text
      />
    </StyledListItem>
  );
};

EntranceListItem.propTypes = {
  entrance: idNameType
};
EntranceListItem.defaultProps = {
  entrance: undefined
};

export default EntranceListItem;
