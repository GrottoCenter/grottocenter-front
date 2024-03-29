import React, { useState } from 'react';
import { storiesOf } from '@storybook/react';

import UserGroups from './UserGroups';
import PersonProperties from '../../common/Person/PersonProperties';

const user = {
  id: 42,
  name: 'John',
  surname: 'Doe',
  nickname: 'JDoe',
  mail: 'john@doe.com',
  groups: [{ id: 1 }, { id: 2 }]
};

const UserGroupsWrapper = () => {
  const [initialUser, setInitialUser] = useState(user);
  const [selectedUser, setSelectedUser] = useState(user);
  return (
    <UserGroups
      initialUser={initialUser}
      isLoading={false}
      onSaveGroups={() => setInitialUser(selectedUser)}
      selectedUser={selectedUser}
      setSelectedUser={setSelectedUser}
    />
  );
};

storiesOf('ManageUserGroups', module)
  .add('Person Properties', () => <PersonProperties person={user} />)
  .add('User Groups', () => <UserGroupsWrapper />);
