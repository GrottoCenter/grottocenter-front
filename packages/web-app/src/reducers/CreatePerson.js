import {
  POST_PERSON,
  POST_PERSON_FAILURE,
  POST_PERSON_SUCCESS
} from '../actions/Person/CreatePerson';

const initialState = {
  error: null,
  isLoading: false,
  caver: null
};

const createCaver = (state = initialState, action) => {
  switch (action.type) {
    case POST_PERSON:
      return {
        ...initialState,
        isLoading: true
      };
    case POST_PERSON_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        caver: action.caver
      };
    case POST_PERSON_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default createCaver;
