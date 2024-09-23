import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { Typography, Box } from '@mui/material';

const UserPropertyName = styled(Typography)`
  display: inline-block;
  margin-right: ${({ theme }) => theme.spacing(4)};
  width: 200px;
`;

const UserProperty = ({ propertyName, value }) => (
  <Box>
    <UserPropertyName
      variant="h5"
      color="primary"
      display="inline"
      align="right">
      <b>{propertyName}</b>
    </UserPropertyName>
    <Typography variant="h5" display="inline">
      {value || <i>{value}</i>}
    </Typography>
  </Box>
);

UserProperty.propTypes = {
  propertyName: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const PersonProperties = ({ person }) => {
  const { formatMessage } = useIntl();

  let groupString = '';
  let groupsComplete = true;
  // eslint-disable-next-line no-param-reassign
  if (!person.groups) person.groups = [];
  const mappedGroups = person.groups.map(group => {
    if (!group.name) {
      groupsComplete = false;
      return '';
    }
    return `${formatMessage({ id: group.name })}`;
  });
  groupString = mappedGroups.filter(e => e).join(', ');

  return (
    <Box style={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'User information' })}
      </Typography>
      <UserProperty
        propertyName={formatMessage({ id: 'Id' })}
        value={person.id}
      />
      <UserProperty
        propertyName={formatMessage({
          id: 'Caver.Name',
          defaultMessage: 'Name'
        })}
        value={person.name}
      />
      <UserProperty
        propertyName={formatMessage({ id: 'Surname' })}
        value={person.surname}
      />
      <UserProperty
        propertyName={formatMessage({ id: 'Nickname' })}
        value={person.nickname}
      />
      {person.language && person.language !== '000' && (
        <UserProperty
          propertyName={formatMessage({ id: 'Language' })}
          value={person.language}
        />
      )}
      {person.groups.length > 0 && groupsComplete && (
        <UserProperty
          propertyName={formatMessage({ id: 'Groups' })}
          value={groupString}
        />
      )}
      {person.mail && (
        <UserProperty
          propertyName={formatMessage({ id: 'Mail' })}
          value={person.mail}
        />
      )}
    </Box>
  );
};

PersonProperties.propTypes = {
  person: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    nickname: PropTypes.string.isRequired,
    surname: PropTypes.string,
    language: PropTypes.string,
    groups: PropTypes.arrayOf(PropTypes.shape({})),
    mail: PropTypes.string
  }).isRequired
};

export default PersonProperties;
