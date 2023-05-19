import { connect } from 'react-redux';
import { loadRecentChanges } from '../actions/RecentChanges';
import RecentChangesCard from '../components/common/card/RecentChangesCard';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = dispatch => ({
  fetch: () => dispatch(loadRecentChanges())
});

const mapStateToProps = state => ({
  isFetching: state.recentChange.isFetching,
  changes: state.recentChange.changes
});

export default connect(mapStateToProps, mapDispatchToProps)(RecentChangesCard);
