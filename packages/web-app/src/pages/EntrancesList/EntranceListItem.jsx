import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';
import DataQualityBadge from '../../components/common/DataQualityBadge';
import AppLink from '../../components/common/AppLink';

const StyledListItem = styled(ListItem)`
  gap: 12px;
`;

const EntranceListItem = ({ entrance }) => {
  const { formatMessage } = useIntl();

  return (
    <StyledListItem
      component={AppLink}
      to={`/ui/entrances/${entrance.id_entrance}`}
      openInNewTabDesktop>
      <DataQualityBadge value={entrance.data_quality} />
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
  entrance: PropTypes.shape({
    name: PropTypes.string,
    id_entrance: PropTypes.number,
    data_quality: PropTypes.number
  })
};

export default EntranceListItem;
