import {
  UPDATE_DESCRIPTION,
  UPDATE_DESCRIPTION_FAILURE,
  UPDATE_DESCRIPTION_SUCCESS
} from '../actions/UpdateDescription';

const initialState = {
  error: null,
  isLoading: false,
  description: null
};

const updateDescription = (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_DESCRIPTION:
      return {
        ...initialState,
        isLoading: true
      };
    case UPDATE_DESCRIPTION_SUCCESS:
      return {
        ...initialState,
        isLoading: false,
        description: action.description
      };
    case UPDATE_DESCRIPTION_FAILURE:
      return {
        ...initialState,
        error: action.error
      };
    default:
      return state;
  }
};

export default updateDescription;
