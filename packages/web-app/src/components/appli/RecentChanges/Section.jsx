import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import {
  RECENT_CHANGES_SCOPES,
  RECENT_CHANGES_MESSAGE_VALUES
} from '@/utils/recentChanges';
import RecentChangesFeed from './Feed';

const RecentChangesSection = ({ scopeType, scopeId }) => {
  const { formatMessage } = useIntl();
  const scope = RECENT_CHANGES_SCOPES[scopeType];

  return (
    <ScrollableContent
      anchorId="activities"
      dense
      collapsible={false}
      title={formatMessage({ id: 'Activities' })}
      subheader={formatMessage(
        { id: scope.description },
        RECENT_CHANGES_MESSAGE_VALUES
      )}
      content={<RecentChangesFeed filters={{ [scope.filter]: scopeId }} />}
    />
  );
};

RecentChangesSection.propTypes = {
  scopeType: PropTypes.oneOf(Object.keys(RECENT_CHANGES_SCOPES)).isRequired,
  scopeId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default RecentChangesSection;
