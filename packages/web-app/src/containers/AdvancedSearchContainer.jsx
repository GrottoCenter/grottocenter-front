import { connect } from 'react-redux';
import {
  fetchAdvancedsearchResults,
  resetAdvancedSearchResults
} from '../actions/Advancedsearch';
import { loadDocumentTypes } from '../actions/DocumentType';
import { loadSubjects } from '../actions/Subject';
import AdvancedSearch from '../components/appli/AdvancedSearch';

const startAdvancedsearch = (formValues, resourceType) => dispatch => {
  dispatch(fetchAdvancedsearchResults(formValues, resourceType));
};

const resetAdvancedSearch = () => dispatch => {
  dispatch(resetAdvancedSearchResults());
};

const getSubjects = () => dispatch => {
  dispatch(loadSubjects());
};

const getDocumentTypes = () => dispatch => {
  dispatch(loadDocumentTypes());
};

const mapDispatchToProps = dispatch => ({
  startAdvancedsearch: (formValues, resourceType) =>
    dispatch(startAdvancedsearch(formValues, resourceType)),
  resetAdvancedSearch: () => dispatch(resetAdvancedSearch()),
  getDocumentTypes: () => dispatch(getDocumentTypes()),
  getSubjects: () => dispatch(getSubjects())
});

const mapStateToProps = state => ({
  documentTypes: state.documentType.documentTypes,
  subjects: state.subject.subjects
});

export default connect(mapStateToProps, mapDispatchToProps)(AdvancedSearch);
