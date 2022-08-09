import { connect } from 'react-redux';
import { loadRandomEntrance } from '../actions/RandomEntrance';
import RandomEntryCard from '../components/common/card/RandomEntryCard';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = dispatch => ({
  fetch: () => dispatch(loadRandomEntrance())
});

const mapStateToProps = state => ({
  isFetching: state.randomEntrance.isFetching,
  entry: state.randomEntrance.entrance
});

export default connect(mapStateToProps, mapDispatchToProps)(RandomEntryCard);
