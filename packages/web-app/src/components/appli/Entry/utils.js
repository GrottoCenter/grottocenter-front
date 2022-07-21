import React, { Fragment } from 'react';

// Handle \n as new line
const makeFormattedText = text =>
  text.split('\\n').map((item, key) => (
    // eslint-disable-next-line react/no-array-index-key
    <Fragment key={key}>
      {item}
      <br />
    </Fragment>
  ));

export default makeFormattedText;
