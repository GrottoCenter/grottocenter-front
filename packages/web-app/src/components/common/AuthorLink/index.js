import React from 'react';
import { isNil } from 'ramda';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

const AuthorLink = ({ author }) => {
  const { formatMessage } = useIntl();
  return !isNil(author.id) && !isNil(author.nickname) ? (
    <span>
      {formatMessage({ id: 'Posted by' })}{' '}
      <a href={author.url}>{author.nickname}</a>
    </span>
  ) : (
    <span>{formatMessage({ id: 'Posted by an unknown author' })}</span>
  );
};

AuthorLink.propTypes = {
  author: PropTypes.shape({
    id: PropTypes.number,
    nickname: PropTypes.string,
    url: PropTypes.string
  })
};

export default AuthorLink;
