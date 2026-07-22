import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Paper,
  Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import Skeleton from '@mui/material/Skeleton';

import InfoSection from '../../common/InfoSection';
import AppLink from '../../common/AppLink';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';
import Alert from '../../common/Alert';
import idNameType from '../../../types/idName.type';

const LoadingList = () => (
  <>
    <Skeleton />
    <Skeleton />
    <Skeleton />
  </>
);

const EntrancesList = ({
  isLoading,
  entrances,
  selectedEntrancesId = [],
  onToggleSelection,
  inline = false
}) => {
  const { formatMessage } = useIntl();
  const listContent = (
    <List
      dense
      disablePadding
      sx={{
        '& .MuiListItemButton-root': { py: 0.25, pl: 0.25, minHeight: 0 },
        '& .MuiListItemIcon-root': { minWidth: 32 }
      }}>
      {isLoading && <LoadingList />}
      {entrances && entrances.length > 0 ? (
        entrances
          .sort((e1, e2) => (e1.name ?? '').localeCompare(e2.name ?? ''))
          .map(entrance => {
            const isSelected = selectedEntrancesId.includes(entrance.id);
            const isVisible =
              selectedEntrancesId.length === 0 || isSelected;
            return (
              <ListItem
                key={entrance.id}
                disablePadding
                secondaryAction={
                  onToggleSelection && (
                    <Tooltip
                      placement="left"
                      title={formatMessage({
                        id:
                          selectedEntrancesId.length === 1 && isSelected
                            ? 'Show all on map'
                            : isSelected
                              ? 'Hide from map'
                              : 'Show on map'
                      })}>
                      <IconButton
                        edge="end"
                        size="small"
                        color={isVisible ? 'primary' : 'default'}
                        onClick={() => onToggleSelection(entrance.id)}>
                        {isVisible ? (
                          <VisibilityIcon fontSize="small" />
                        ) : (
                          <VisibilityOffIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                  )
                }>
                <ListItemButton
                  component={AppLink}
                  to={`/ui/entrances/${entrance.id}`}
                  selected={selectedEntrancesId.includes(entrance.id)}>
                  <ListItemIcon>
                    <CustomIcon type="entrance" />
                  </ListItemIcon>
                  <ListItemText primary={entrance.name} />
                </ListItemButton>
              </ListItem>
            );
          })
      ) : (
        <Alert
          severity="info"
          content={formatMessage({
            id: 'There is currently no entrance for this network.'
          })}
        />
      )}
    </List>
  );

  if (inline) {
    return (
      <Box sx={{ height: '100%', overflow: 'auto' }}>
        <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
          <InfoSection
            title={formatMessage({ id: 'Entrances' })}>

            {listContent}
          </InfoSection>
        </Paper>
      </Box>
    );
  }

  return (
    <ScrollableContent
      anchorId="entrances"
      title={formatMessage({ id: 'Entrances' })}
      content={listContent}
    />
  );
};

EntrancesList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  entrances: PropTypes.arrayOf(idNameType).isRequired,
  selectedEntrancesId: PropTypes.arrayOf(PropTypes.number),
  onToggleSelection: PropTypes.func,
  inline: PropTypes.bool
};

export default EntrancesList;
