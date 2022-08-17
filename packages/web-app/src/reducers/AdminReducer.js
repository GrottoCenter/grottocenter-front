import {
  GET_ADMINS,
  GET_ADMINS_FAILURE,
  GET_ADMINS_SUCCESS
} from '../actions/Person/GetPerson';

const initialState = {
  errorMessages: [],
  isLoading: false,
  latestHttpCode: undefined,
  admins: [],
  moderators: []
};

const admin = (state = initialState, action) => {
  switch (action.type) {
    case GET_ADMINS:
      return {
        ...state,
        isLoading: true,
        errorMessages: [],
        latestHttpCode: undefined
      };
    case GET_ADMINS_FAILURE:
      return {
        ...state,
        isLoading: false,
        errorMessages: [action.errorMessage]
      };
    case GET_ADMINS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        errorMessages: [],
        admins: action.admins
      };

    default:
      return state;
  }
};

export default admin;
