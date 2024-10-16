import {
  UPDATE_PERSON,
  UPDATE_PERSON_FAILURE,
  UPDATE_PERSON_SUCCESS
} from '../actions/Person/UpdatePerson';

const initialState = {
  error: null,
  isLoading: false,
  person: null
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_PERSON:
      return {
        ...state,
        isLoading: true
      };
    case UPDATE_PERSON_SUCCESS:
      return {
        ...state,
        isLoading: false,
        person: action.person
      };
    case UPDATE_PERSON_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
