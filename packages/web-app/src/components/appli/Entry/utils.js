import React, { Fragment } from 'react';
import { isNil } from 'ramda';
// Handle \n as new line
export const makeFormattedText = text =>
  text.split('\\n').map((item, key) => (
    // eslint-disable-next-line react/no-array-index-key
    <Fragment key={key}>
      {item}
      <br />
    </Fragment>
  ));

export const authorLink = author =>
  !isNil(author.id) && !isNil(author.nickname) ? (
    <span>
      Posted by <a href={author.url}>{author.nickname}</a>
    </span>
  ) : (
    ''
  );
