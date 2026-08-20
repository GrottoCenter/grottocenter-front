import { configureStore } from '@reduxjs/toolkit';

import GCReducer from './reducers/GCReducer';
import { SET_FILE } from './actions/Observations/importWizardTypes';

// The store lives here rather than inside ApplicationShell so that code running
// outside React can reach it — the QueryClient's global error handler is created
// at module scope and needs to dispatch(postLogout()) on a 401 without importing
// a component (see conf/queryClient.js).
//
// configureStore, not createStore: createStore has been deprecated since Redux
// 4.2. It takes the existing combined reducer as-is — no reducer is rewritten as
// a slice — and it replaces the manual composeEnhancers/applyMiddleware wiring
// this file used to carry, since thunk and the devtools come as defaults.
const store = configureStore({
  reducer: GCReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // Both dev-only checks deep-traverse the whole state on every action. The
      // `map` slice holds the bulk /geoloc payloads (megabytes of coordinates),
      // which makes that traversal cost real time on every pan. The import
      // wizard intentionally retains the selected browser File across steps;
      // browsers and parsers may lazily attach properties such as
      // `lastModifiedDate` to that native mutable object. Exclude only that
      // leaf while keeping both guards active for the rest of the wizard.
      immutableCheck: { ignoredPaths: ['map', 'importWizard.file'] },
      serializableCheck: {
        ignoredPaths: ['map', 'importWizard.file'],
        ignoredActions: [SET_FILE]
      }
    })
});

export default store;
