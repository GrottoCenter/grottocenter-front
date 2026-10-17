import PropTypes from 'prop-types';

import CustomIcon from '@/components/common/CustomIcon';
import IconLabel from '@/components/common/IconLabel';
import Translate from '@/components/common/Translate';
import {
  getPersonIconType,
  getPersonTypeLabelId,
  isPersonType
} from '@/utils/personTypes';

const PersonType = ({ type = null, size = 20 }) => (
  <IconLabel
    icon={
      isPersonType(type) && (
        <CustomIcon type={getPersonIconType(type)} size={size} alt="" />
      )
    }>
    <Translate>{getPersonTypeLabelId(type)}</Translate>
  </IconLabel>
);

PersonType.propTypes = { type: PropTypes.string, size: PropTypes.number };

export default PersonType;
