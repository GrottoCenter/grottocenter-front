import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import Alert from '../../common/Alert';
import NewEntityButton from '../../common/NewEntityButton';

const ScienceSection = ({ caveId }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      dense
      anchorId="science"
      defaultExpanded
      title={formatMessage({ id: 'Science' })}
      icon={
        <NewEntityButton
          to={`/ui/observations/import?caveId=${caveId}&locked=true`}
          size="small"
          tooltip={formatMessage({ id: 'Import observations' })}
          icon={<EntityIcon iconType="scientific_observation" size={20} />}
        />
      }
      content={
        <Alert
          severity="info"
          content={formatMessage({
            id: 'Science data integration in progress.'
          })}
        />
      }
    />
  );
};

ScienceSection.propTypes = {
  caveId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

export default ScienceSection;
