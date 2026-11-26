import { Box, Chip } from '@mui/material';
import { useIntl } from 'react-intl';
import CustomIcon from '@/components/common/CustomIcon';
import IconLabel from '@/components/common/IconLabel';
import { getPersonName } from '@/utils/personDuplicates';
import { PROTECTED_AUTHOR_LABEL_IDS } from '@/utils/personConstants';
import { getPersonIconType, getPersonTypeLabelId } from '@/utils/personTypes';
import { personShape } from './personShape';

// Keep the collapsed suggestion and expanded comparison header identical.
const PersonComparisonLabel = ({ person }) => {
  const { formatMessage } = useIntl();
  const specialLabelId =
    person.type === 'AUTHOR' && PROTECTED_AUTHOR_LABEL_IDS[Number(person.id)];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1
      }}>
      <IconLabel
        alignToFirstLine
        icon={
          <CustomIcon
            type={getPersonIconType(person.type)}
            size={20}
            alt={formatMessage({ id: getPersonTypeLabelId(person.type) })}
          />
        }>
        <Box component="strong" sx={{ fontWeight: 600 }}>
          {getPersonName(person)}
        </Box>{' '}
        <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary' }}>
          #{person.id}
        </Box>
      </IconLabel>
      {specialLabelId && (
        <Chip
          component="span"
          size="small"
          label={formatMessage({ id: specialLabelId })}
        />
      )}
    </Box>
  );
};

PersonComparisonLabel.propTypes = { person: personShape.isRequired };

export default PersonComparisonLabel;
