import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Chip, Typography } from '@mui/material';

const PersonProperties = ({ person, canEdit = false }) => {
  const { formatMessage } = useIntl();

  const groups = (person.groups ?? [])
    .filter(g => g.name)
    .map(g => formatMessage({ id: g.name }))
    .join(', ');

  const detailRows = [
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {person.isBanned && (
        <Chip
          label={formatMessage({ id: 'Banned' })}
          color="error"
          size="small"
          sx={{ alignSelf: 'flex-start' }}
        />
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ minWidth: '120px', flexShrink: 0 }}>
            {formatMessage({ id: 'Nickname' })}
          </Typography>
          <Box>
            <Typography
              variant="h5"
              fontWeight={700}
              color="primary"
              lineHeight={1.2}>
              {person.nickname}
            </Typography>
            {canEdit && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: '2px' }}>
                {formatMessage({
                  id: 'The nickname defines how other users see you.'
                })}
              </Typography>
            )}
          </Box>
        </Box>
        {detailRows.map(({ label, value }) => (
          <Box
            key={label}
            sx={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: '120px', flexShrink: 0 }}>
              {label}
            </Typography>
            <Typography variant="body1" fontWeight={500}>
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
    surname: PropTypes.string,
    language: PropTypes.string,
    groups: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string })),
    mail: PropTypes.string,
    isBanned: PropTypes.bool
  }).isRequired
};

export default PersonProperties;
