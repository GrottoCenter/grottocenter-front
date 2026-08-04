import PropTypes from 'prop-types';
import { Box, Typography, List } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import GuidelinePropTypes from '../../../types/guideline.type';
import Guideline from './Guideline';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';

const GuidelinesGrouped = ({ guidelines }) => {
  if (!guidelines) return null;

  const { country, region, massif } = guidelines;

  const groups = [
    { key: 'country', items: country, titleId: 'Country guidelines' },
    { key: 'region', items: region, titleId: 'Region guidelines' },
    { key: 'massif', items: massif, titleId: 'Massif guidelines' }
  ].filter(group => group.items && group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <ScrollableContent
      title={<FormattedMessage id="Guidelines" />}
      anchorId="guidelines">
      <Box p={1}>
        {groups.map((group, index) => (
          <Box key={group.key} mt={index > 0 ? 2 : 0.25}>
            <Typography variant="h3" gutterBottom>
              <FormattedMessage id={group.titleId} />
            </Typography>
            <List disablePadding>
              {group.items.map(guideline => (
                <Guideline
                  key={guideline.id}
                  guideline={guideline}
                  isEditAllowed={false}
                />
              ))}
            </List>
          </Box>
        ))}
      </Box>
    </ScrollableContent>
  );
};

GuidelinesGrouped.propTypes = {
  guidelines: PropTypes.shape({
    country: PropTypes.arrayOf(GuidelinePropTypes),
    region: PropTypes.arrayOf(GuidelinePropTypes),
    massif: PropTypes.arrayOf(GuidelinePropTypes)
  })
};

export default GuidelinesGrouped;
