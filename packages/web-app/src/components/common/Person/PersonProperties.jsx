import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Chip, Typography } from '@mui/material';

import PersonType from './PersonType';

const PersonProperties = ({ person, canEdit = false }) => {
  const { formatMessage } = useIntl();

  const groups = (person.groups ?? [])
    .filter(g => g.name)
    .map(g => formatMessage({ id: g.name }))
    .join(', ');

  const detailRows = [
    {
      label: formatMessage({ id: 'Type' }),
      value: (
        <Box
          component="span"
          data-testid="person-type-label"
          sx={{ display: 'inline-flex', alignItems: 'center' }}>
          <PersonType type={person.type} size={24} />
        </Box>
      )
    },
    {
      label: formatMessage({ id: 'Nickname' }),
      alignItems: 'baseline',
      value: (
        <Box>
          <Typography
            component="span"
            variant="h5"
            color="primary"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {person.nickname}
          </Typography>
          {canEdit && (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', mt: 0.25 }}>
              {formatMessage({
                id: 'The nickname defines how other users see you.'
              })}
            </Typography>
          )}
        </Box>
      )
    },
    { label: formatMessage({ id: 'Id' }), value: `${person.id}` },
    person.name && {
      label: formatMessage({ id: 'Caver.Name', defaultMessage: 'Name' }),
      value: person.name
    },
    person.surname && {
      label: formatMessage({ id: 'Surname' }),
      value: person.surname
    },
    person.language &&
      person.language !== '000' && {
        label: formatMessage({ id: 'Language' }),
        value: person.language
      },
    groups && { label: formatMessage({ id: 'Groups' }), value: groups },
    person.mail && { label: formatMessage({ id: 'Mail' }), value: person.mail }
  ].filter(Boolean);

  return (
    <Box
      data-testid="person-properties"
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {person.isBanned && (
        <Chip
          label={formatMessage({ id: 'Banned' })}
          color="error"
          size="small"
          sx={{ alignSelf: 'flex-start' }}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {detailRows.map(({ label, value, alignItems = 'center' }) => (
          <Box key={label} sx={{ display: 'flex', alignItems, gap: 1.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                minWidth: '120px',
                flexShrink: 0
              }}>
              {label}
            </Typography>
            <Typography
              component="div"
              variant="body1"
              sx={{
                fontWeight: 500
              }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

PersonProperties.propTypes = {
  canEdit: PropTypes.bool,
  person: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    nickname: PropTypes.string.isRequired,
    type: PropTypes.string,
    surname: PropTypes.string,
    language: PropTypes.string,
    groups: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
    mail: PropTypes.string,
    isBanned: PropTypes.bool
  }).isRequired
};

export default PersonProperties;
