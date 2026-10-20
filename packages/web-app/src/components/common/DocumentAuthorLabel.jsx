import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import {
  getPersonIconType,
  getPersonTypeLabelId,
  isPersonType
} from '@/utils/personTypes';
import CustomIcon from './CustomIcon';
import IconLabel from './IconLabel';

const DocumentAuthorLabel = ({
  author,
  entityType = 'persons',
  size = 18,
  alignToFirstLine = false
}) => {
  const { formatMessage } = useIntl();
  const isOrganization = entityType === 'organizations';
  const name = isOrganization ? author.name : author.nickname;
  return (
    <IconLabel
      alignToFirstLine={alignToFirstLine}
      icon={
        <CustomIcon
          type={
            isOrganization ? 'organization' : getPersonIconType(author.type)
          }
          size={size}
          alt={isOrganization ? formatMessage({ id: 'Organization' }) : ''}
        />
      }>
      {name}
      {!isOrganization && isPersonType(author.type) && (
        <Typography
          component="span"
          variant="body2"
          sx={{ ml: 0.5, opacity: 0.8 }}>
          ({formatMessage({ id: getPersonTypeLabelId(author.type) })})
        </Typography>
      )}
    </IconLabel>
  );
};

DocumentAuthorLabel.propTypes = {
  author: PropTypes.shape({
    name: PropTypes.string,
    nickname: PropTypes.string,
    type: PropTypes.string
  }).isRequired,
  entityType: PropTypes.oneOf(['persons', 'organizations']),
  size: PropTypes.number,
  alignToFirstLine: PropTypes.bool
};

export default DocumentAuthorLabel;
