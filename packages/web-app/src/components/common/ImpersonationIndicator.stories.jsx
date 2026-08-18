import { useState } from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

import loginReducer from '../../reducers/LoginReducer';
import ImpersonationIndicator from './ImpersonationIndicator';

const initialLoginState = {
  authTokenDecoded: {
    exp: Date.now() / 1000 + 3600,
    groups: [{ name: 'Administrator' }]
  },
  impersonatedRole: 'Moderator'
};

const IndicatorStory = () => {
  const [store] = useState(() =>
    createStore((state, action) => ({
      login: loginReducer(state?.login ?? initialLoginState, action)
    }))
  );

  return (
    <Provider store={store}>
      <ImpersonationIndicator />
    </Provider>
  );
};

const meta = {
  title: 'Common/ImpersonationIndicator',
  component: ImpersonationIndicator
};

export default meta;

export const Default = {
  render: () => <IndicatorStory />
};
