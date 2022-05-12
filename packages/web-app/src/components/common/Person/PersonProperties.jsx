import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Typography, Box } from '@material-ui/core';

const UserPropertyName = styled(Typography)`
  display: inline-block;
  margin-right: ${({ theme }) => theme.spacing(4)}px;
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

const PersonProperties = ({
  person,
  displayLanguage,
  displayMail,
  displayGroups
}) => {
  const { formatMessage } = useIntl();

  let groupString = '';
  if (displayGroups) {
    const { groups } = person;
    const mappedGroups = groups.map(
      group => `${formatMessage({ id: group.name })}`
    );
    groupString = mappedGroups.join(', ');
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
        value={person.surname ? person.surname.toUpperCase() : person.surname}
      />
      <UserProperty
        propertyName={formatMessage({ id: 'Nickname' })}
        value={person.nickname}
      />
      {displayLanguage && (
        <UserProperty
          propertyName={formatMessage({ id: 'Language' })}
          value={person.language}
        />
      )}
      {displayGroups && (
        <UserProperty
          propertyName={formatMessage({ id: 'Groups' })}
          value={groupString}
        />
      )}
      {displayMail && (
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
  }).isRequired,
  displayLanguage: PropTypes.bool,
  displayMail: PropTypes.bool,
  displayGroups: PropTypes.bool
};

PersonProperties.defaultProps = {
  displayLanguage: false,
  displayMail: false,
  displayGroups: false
};

export default PersonProperties;
