import React from 'react';
import PropTypes from 'prop-types';

/* Encapsulate the grid mecanism in React components */

export const GridContainer = ({ className, children }) => (
  <div className={['container', className].join(' ')}>{children}</div>
);

GridContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export const GridRow = ({ className, children }) => (
  <div className={['row', className].join(' ')}>{children}</div>
);

GridRow.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export const GridOneThirdColumn = ({ className, children }) => (
  <div className={['four columns', className].join(' ')}>{children}</div>
);

GridOneThirdColumn.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export const GridTwoThirdColumn = ({ className, children }) => (
  <div className={['eight columns', className].join(' ')}>{children}</div>
);

GridTwoThirdColumn.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export const GridOneHalfColumn = ({ className, children }) => (
  <div className={['six columns', className].join(' ')}>{children}</div>
);

GridOneHalfColumn.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export const GridFullColumn = ({ className, children }) => (
  <div className={['twelve columns', className].join(' ')}>{children}</div>
);

GridFullColumn.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
