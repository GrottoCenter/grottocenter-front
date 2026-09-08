import PropTypes from 'prop-types';
import { List } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import GuidelinePropTypes from '../../../types/guideline.type';
import Guideline from './Guideline';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';

const GROUPS = [
  { key: 'country', scopeType: 'country' },
  { key: 'region', scopeType: 'region' },
  { key: 'massif', scopeType: 'massif' }
];

const groupByGuideline = guidelines => {
  const groupedById = new Map();

  GROUPS.forEach(({ key, scopeType }) => {
    (guidelines[key] ?? []).forEach(guideline => {
      const existing = groupedById.get(guideline.id);
      if (existing) {
        existing.scopeTypes.push(scopeType);
        return;
      }

      groupedById.set(guideline.id, {
        guideline,
        scopeTypes: [scopeType]
      });
    });
  });

  return Array.from(groupedById.values());
};

const GuidelinesGrouped = ({ guidelines }) => {
  if (!guidelines) return null;

  const groupedGuidelines = groupByGuideline(guidelines);

  if (groupedGuidelines.length === 0) return null;

  return (
    <ScrollableContent
      dense
      title={<FormattedMessage id="Guidelines" />}
      anchorId="guidelines"
      count={groupedGuidelines.length}>
      <List dense disablePadding>
        {groupedGuidelines.map(({ guideline, scopeTypes }) => (
          <Guideline
            key={guideline.id}
            guideline={guideline}
            scopeTypes={scopeTypes}
            hideAttribution
          />
        ))}
      </List>
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
