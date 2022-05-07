import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';

const UserPropertyName = styled(Typography)`
  display: inline-block;
  margin-right: ${({ theme }) => theme.spacing(4)}px;
  width: 300px;
`;

const UserProperty = ({ propertyName, value }) => (
  <div>
    <UserPropertyName
      variant="h3"
      color="primary"
      display="inline"
      align="right">
      <b>{propertyName}</b>
    </UserPropertyName>
    <Typography variant="h3" display="inline">
      {value || <i>{value}</i>}
    </Typography>
  </div>
);

UserProperty.propTypes = {
  propertyName: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const PersonProperties = ({ person, id }) => {
  const { formatMessage } = useIntl();
  let groupString = '';
  person.groups.forEach((group, index) => {
    if (index !== person.groups.length - 1) {
      groupString += `${formatMessage({ id: group.name })}, `;
    } else {
      groupString += group.name;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h2" gutterBottom>
        {formatMessage({ id: 'User information' })}
      </Typography>
      <UserProperty propertyName={formatMessage({ id: 'Id' })} value={id} />
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
      <UserProperty
        propertyName={formatMessage({ id: 'Language' })}
        value={person.language}
      />
      <UserProperty
        propertyName={formatMessage({ id: 'Groups' })}
        value={groupString}
      />
    </div>
  );
};

PersonProperties.propTypes = {
  person: PropTypes.shape({
    name: PropTypes.string,
    nickname: PropTypes.string,
    surname: PropTypes.string,
    language: PropTypes.string,
    groups: PropTypes.arrayOf(PropTypes.shape({}))
  }).isRequired,
  id: PropTypes.string.isRequired
};

export default PersonProperties;
