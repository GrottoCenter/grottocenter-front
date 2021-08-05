import { connect } from 'react-redux';
import SimpleMenuEntry from '../components/appli/SimpleMenuEntry';
import { toggleSideMenu } from '../actions/SideMenu';

const mapDispatchToProps = dispatch => ({
  toggleSideMenu: () => dispatch(toggleSideMenu())
});

const mapStateToProps = state => ({
  visible: state.sideMenu.visible
});

const SimpleMenuEntryConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(SimpleMenuEntry);

export default SimpleMenuEntryConnector;
