import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { depthIcon, lengthIcon } from '../../../assets/icons';
import CustomIcon from '../CustomIcon';
import AppLink from '../AppLink';

const StatBadge = ({ src, alt, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    <img src={src} alt={alt} style={{ height: 24, width: 24 }} />
    <Typography variant="body2" color="text.secondary">
      {value}
    </Typography>
  </Box>
);

StatBadge.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired
};

const CardLabel = ({ children }) => (
  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
    <Typography
      variant="body1"
      fontWeight={600}
      sx={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
      {children}
    </Typography>
  </Box>
);

CardLabel.propTypes = {
  children: PropTypes.node.isRequired
};

// "item-action" coordinates the card hover state with its optional action.
const cardPaperSx = {
  borderRadius: 2,
  overflow: 'hidden',
  bgcolor: 'grey.50',
  transition: 'box-shadow 0.15s',
  '@media (hover: hover)': {
    '&:hover': { boxShadow: 3 },
    '&:hover .item-action': { opacity: 1 }
  },
  '& .item-action': { opacity: 0, transition: 'opacity 0.15s' },
  '&:focus-within .item-action': { opacity: 1 },
  '@media (hover: none)': { '& .item-action': { opacity: 1 } }
};

const cardLinkSx = {
  display: 'flex',
  alignItems: 'stretch',
  gap: '12px',
  p: 2,
  flex: 1,
  minWidth: 0,
  textDecoration: 'none',
  color: 'inherit',
  userSelect: 'none',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent'
};

export const EntityCard = ({ to, icon, children, itemActionButton }) => (
  <Paper variant="outlined" sx={cardPaperSx}>
    <Box sx={{ display: 'flex', alignItems: 'stretch', minHeight: 72 }}>
      <Box component={AppLink} to={to} sx={cardLinkSx}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {icon}
        </Box>
        {children}
      </Box>
      {itemActionButton && (
        <Box
          className="item-action"
          sx={{ display: 'flex', alignItems: 'center', pr: 0.5 }}>
          {itemActionButton}
        </Box>
      )}
    </Box>
  </Paper>
);

EntityCard.propTypes = {
  to: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  itemActionButton: PropTypes.node
};

export const EntityCardsGrid = ({ children }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: '1fr',
        sm: 'repeat(2, 1fr)',
        md: 'repeat(3, 1fr)'
      },
      gap: { xs: 1, md: 2 }
    }}>
    {children}
  </Box>
);

EntityCardsGrid.propTypes = {
  children: PropTypes.node.isRequired
};

export const CaveCard = ({ cave, itemActionButton }) => {
  const locale = useSelector(state => state.intl.locale);

  return (
    <EntityCard
      to={`/ui/caves/${cave.id}`}
      icon={<CustomIcon type="network" size={32} />}
      itemActionButton={itemActionButton}>
      <Box
        sx={{
          minWidth: 0,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
        <Typography
          variant="body1"
          fontWeight={600}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3
          }}>
          {cave.name}
        </Typography>
        {(cave.depth || cave.length) && (
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            {cave.depth && (
              <StatBadge
                src={depthIcon}
                alt="depth"
                value={`${cave.depth.toLocaleString(locale)} m`}
              />
            )}
            {cave.length && (
              <StatBadge
                src={lengthIcon}
                alt="length"
                value={`${cave.length.toLocaleString(locale)} m`}
              />
            )}
          </Box>
        )}
      </Box>
    </EntityCard>
  );
};

CaveCard.propTypes = {
  cave: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    depth: PropTypes.number,
    length: PropTypes.number
  }),
  itemActionButton: PropTypes.node
};

export const EntranceCard = ({ link, label, itemActionButton }) => (
  <EntityCard
    to={link}
    icon={<CustomIcon type="entrance" size={32} />}
    itemActionButton={itemActionButton}>
    <CardLabel>{label}</CardLabel>
  </EntityCard>
);

EntranceCard.propTypes = {
  link: PropTypes.string.isRequired,
  label: PropTypes.node.isRequired,
  itemActionButton: PropTypes.node
};

export const PersonCard = ({ person, itemActionButton }) => (
  <EntityCard
    to={`/ui/persons/${person.id}`}
    icon={<CustomIcon type="caver" size={32} />}
    itemActionButton={itemActionButton}>
    <CardLabel>{person.nickname}</CardLabel>
  </EntityCard>
);

PersonCard.propTypes = {
  person: PropTypes.shape({
    id: PropTypes.number,
    nickname: PropTypes.string
  }),
  itemActionButton: PropTypes.node
};

export const OrganizationCard = ({ organization, itemActionButton }) => {
  const { formatMessage } = useIntl();

  if (organization.isDeleted) {
    // A deleted organization links to its successor when one exists, otherwise
    // it stays on its own (tombstone) page.
    const to = organization.redirectTo
      ? `/ui/organizations/${organization.redirectTo}`
      : `/ui/organizations/${organization.id}`;
    return (
      <EntityCard
        to={to}
        icon={<CustomIcon type="organization" size={32} />}
        itemActionButton={itemActionButton}>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'wrap'
          }}>
          <Typography
            variant="body1"
            fontWeight={600}
            color="text.disabled"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textDecoration: 'line-through'
            }}>
            {organization.name}
          </Typography>
          <Chip
            size="small"
            color="warning"
            label={formatMessage({ id: 'Deleted' })}
          />
        </Box>
      </EntityCard>
    );
  }

  return (
    <EntityCard
      to={`/ui/organizations/${organization.id}`}
      icon={<CustomIcon type="organization" size={32} />}
      itemActionButton={itemActionButton}>
      <CardLabel>{organization.name}</CardLabel>
    </EntityCard>
  );
};

OrganizationCard.propTypes = {
  organization: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    isDeleted: PropTypes.bool,
    redirectTo: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  itemActionButton: PropTypes.node
};
