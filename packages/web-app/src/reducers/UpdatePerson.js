import {
  UPDATE_PERSON,
  UPDATE_PERSON_FAILURE,
  UPDATE_PERSON_SUCCESS
} from '../actions/UpdatePerson';

const initialState = {
  error: null,
  isLoading: false,
  person: null
};

const updatePerson = (state = initialState, action) => {
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
        data: action.person
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

export default updatePerson;
