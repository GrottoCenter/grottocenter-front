import { connect } from 'react-redux';
import ComplexMenuEntry from '../components/appli/ComplexMenuEntry';
import { toggleSideMenu } from '../actions/SideMenu';

const mapDispatchToProps = dispatch => ({
  toggleSideMenu: () => dispatch(toggleSideMenu())
});

const mapStateToProps = (state, ownProps) => {
  let currentItem;
  state.sideMenu.items.forEach(item => {
    if (item.identifier === ownProps.identifier) {
      currentItem = item;
    }
  });
  return {
    open: currentItem ? currentItem.open : false
  };
};

const ComplexMenuEntryConnector = connect(
  mapStateToProps,
  mapDispatchToProps
)(ComplexMenuEntry);

export default ComplexMenuEntryConnector;
