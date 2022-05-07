import {
  FETCH_PERSON,
  FETCH_PERSON_FAILURE,
  FETCH_PERSON_SUCCESS
} from '../actions/Person';

const initialState = {
  person: undefined, // person fetched
  isFetching: false, // show loading spinner
  error: null // fetch errors
};

const person = (state = initialState, action) => {
  switch (action.type) {
    case FETCH_PERSON:
      return { ...state, person: action.person, isFetching: true };
    case FETCH_PERSON_SUCCESS:
      return { ...state, person: action.person, isFetching: false };
    case FETCH_PERSON_FAILURE:
      return { person: null, isFetching: false, error: action.error };
    default:
      return initialState;
  }
};

export default person;
