import { SET_PAGE_TITLE, SET_PAGE_TITLE_TOOLTIP } from '../actions/PageTitle';

const initialState = {
  pageTitle: '',
  pageTitleTooltip: ''
};

const pageTitle = (state = initialState, action) => {
  switch (action.type) {
    case SET_PAGE_TITLE: {
      return {
        ...state,
        pageTitle: action.pageTitle
      };
    }
    case SET_PAGE_TITLE_TOOLTIP: {
      return {
        ...state,
        pageTitleTooltip: action.pageTitleTooltip
      };
    }
    default:
      return state;
  }
};

export default pageTitle;
