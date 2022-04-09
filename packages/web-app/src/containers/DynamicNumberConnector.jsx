import { connect } from 'react-redux';
import DynamicNumber from '../pages/homepage/DynamicNumber';

const mapStateToProps = (state, ownProps) => {
  const attributes = state.dynamicNumber[ownProps.numberType];
  if (attributes === undefined) {
    return {
      isFetching: true
    };
  }

  return {
    isFetching: attributes.isFetching,
    number: attributes.number,
    className: ownProps.className
  };
};

const DynamicNumberConnector = connect(mapStateToProps)(DynamicNumber);

export default DynamicNumberConnector;
