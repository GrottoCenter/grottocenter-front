import { createStore, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import createDebounce from 'redux-debounced';
import GCReducer from './reducers/GCReducer';

const middlewares = applyMiddleware(createDebounce(), thunk);
const composeEnhancers =
  (typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const gcStore = createStore(GCReducer, composeEnhancers(middlewares));

export default gcStore;
