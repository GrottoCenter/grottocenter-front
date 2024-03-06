import React from 'react';
import { isNil } from 'ramda';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import GCLink from '../GCLink';
import authorType from '../../../types/author.type';

const AuthorLink = ({ author, verb = 'Posted' }) => {
  const { formatMessage } = useIntl();
  return !isNil(author?.id) && !isNil(author?.nickname) ? (
    <span>
      <Typography variant="caption">
        {verb ? `${formatMessage({ id: `${verb} by` })} ` : ''}
      </Typography>
      <GCLink internal href={author.url}>
        {author.nickname}
      </GCLink>
    </span>
  ) : (
    <span>{formatMessage({ id: `${verb} by an unknwon author` })}</span>
  );
};

AuthorLink.propTypes = {
  author: authorType,
  verb: PropTypes.string
};

export default AuthorLink;
