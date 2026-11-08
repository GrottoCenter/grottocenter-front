import PropTypes from 'prop-types';
import { Card, Skeleton } from '@mui/material';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import PermMediaOutlinedIcon from '@mui/icons-material/PermMediaOutlined';
import BiotechIcon from '@mui/icons-material/Biotech';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import { useIntl } from 'react-intl';

import FetchErrorState from '../FetchErrorState';
import PageTabs from './PageTabs';
import SectionStack from './SectionStack';

// Entity detail pages share these tab identities, labels and icons. Each page
// supplies only its available tabs, counts, permissions and domain content.
const TAB_DEFINITIONS = {
  information: {
    labelId: 'Information',
    icon: <ExploreOutlinedIcon fontSize="small" />
  },
  documents: {
    labelId: 'Documents',
    icon: <PermMediaOutlinedIcon fontSize="small" />
  },
  science: {
    labelId: 'Science',
    icon: <BiotechIcon fontSize="small" />
  },
  comments: {
    labelId: 'Comments',
    icon: <ChatOutlinedIcon fontSize="small" />
  }
};

const EntityPageTabs = ({
  tabs,
  panels,
  isLoading = false,
  error = null,
  isPaused = false,
  onRetry = null,
  errorMessageId
}) => {
  const { formatMessage } = useIntl();
  const hasError = Boolean(error) || isPaused;
  let state = null;
  if (hasError) {
    state = (
      <FetchErrorState
        error={error}
        isPaused={isPaused}
        onRetry={onRetry}
        messageId={errorMessageId}
      />
    );
  } else if (isLoading) {
    state = (
      <>
        <Skeleton height={300} />
        <Skeleton height={100} />
        <Skeleton height={100} />
      </>
    );
  }

  const resolvedTabs = tabs.map(({ id, count, disabled }) => ({
    id,
    label: formatMessage({ id: TAB_DEFINITIONS[id].labelId }),
    icon: TAB_DEFINITIONS[id].icon,
    count,
    disabled
  }));

  return (
    <PageTabs tabs={resolvedTabs}>
      {/* Keep one panel per declared tab, even when its content is absent.
          Conditional Science content must never shift Comments into its place. */}
      {tabs.map(({ id }) => (
        <div key={id}>
          <SectionStack>
            {state && (
              <Card sx={{ p: 2 }} data-testid="entity-page-state">
                {state}
              </Card>
            )}
            {/* Preserve loaded content and in-progress forms on refetch errors. */}
            {panels[id]}
          </SectionStack>
        </div>
      ))}
    </PageTabs>
  );
};

EntityPageTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOf(Object.keys(TAB_DEFINITIONS)).isRequired,
      count: PropTypes.number,
      disabled: PropTypes.bool
    })
  ).isRequired,
  panels: PropTypes.objectOf(PropTypes.node).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  isPaused: PropTypes.bool,
  onRetry: PropTypes.func,
  errorMessageId: PropTypes.string.isRequired
};

export default EntityPageTabs;
