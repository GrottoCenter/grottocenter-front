import { connect } from 'react-redux';
import ComplexMenuEntry from '../components/appli/ComplexMenuEntry';
import { toggleSideMenu } from '../actions/SideMenu';

//
//
// C O N T A I N E R  // C O N N E C T O R
//
//

const mapDispatchToProps = (dispatch) => ({
  toggleSideMenu: () => dispatch(toggleSideMenu()),
});

const mapStateToProps = (state, ownProps) => {
  let currentItem;
  state.sideMenu.items.map((item) => {
    if (item.identifier === ownProps.identifier) {
      currentItem = item;
    }
  });
  return {
    open: currentItem ? currentItem.open : false,
  };
};

const ComplexMenuEntryConnector = connect(mapStateToProps, mapDispatchToProps)(ComplexMenuEntry);

export default ComplexMenuEntryConnector;
