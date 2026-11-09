import DifferenceOutlinedIcon from '@mui/icons-material/DifferenceOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import { useIntl } from 'react-intl';

export const useRecentChangesTabs = (additionalTabs = []) => {
  const { formatMessage } = useIntl();
  return [
    {
      id: 'information',
      label: formatMessage({ id: 'Information' }),
      icon: <ExploreOutlinedIcon fontSize="small" />
    },
    ...additionalTabs,
    {
      id: 'activities',
      label: formatMessage({ id: 'Activities' }),
      icon: (
        <DifferenceOutlinedIcon
          fontSize="small"
          data-testid="activity-tab-icon"
        />
      ),
      lazy: true
    }
  ];
};
